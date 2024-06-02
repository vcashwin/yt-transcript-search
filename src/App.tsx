import * as React from "react";
import "./App.css";

function App() {
  React.useEffect(() => {
    async function onLoad() {
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          const expandButton = document.getElementById(
            "expand"
          ) as HTMLButtonElement;
          expandButton?.click();

          const transcriptButton = document.querySelector(
            '[aria-label="Show transcript"]'
          ) as HTMLButtonElement;
          transcriptButton?.click();

          function searchAndFilterTranscriptSegments(query: string) {
            if (query === "") {
              // If the query is empty, show all segments
              const segments = document.querySelectorAll(
                "#segments-container ytd-transcript-segment-renderer"
              );
              const segmentHeaders = document.querySelectorAll(
                "#segments-container ytd-transcript-section-header-renderer"
              );
              segments.forEach((segment) => {
                segment.classList.remove("hidden");
              });
              segmentHeaders.forEach((segment) => {
                segment.classList.remove("hidden");
              });
              return;
            }
            // Select all ytd-transcript-segment-renderer elements
            const segments = document.querySelectorAll(
              "#segments-container ytd-transcript-segment-renderer"
            );
            const segmentHeaders = document.querySelectorAll(
              "#segments-container ytd-transcript-section-header-renderer"
            );

            // Create a Map to store indices of matching segments
            const matchingIndices = new Map();

            // Loop through the segments and find the ones containing the query
            segments.forEach((segment, index) => {
              const textElement = segment.querySelector(
                "yt-formatted-string.segment-text"
              );
              if (
                textElement &&
                textElement.textContent?.toLowerCase().includes(query)
              ) {
                matchingIndices.set(index, true); // Store the index of the matching segment
              }
            });

            // Update the DOM to show only matching segments
            segments.forEach((segment, index) => {
              if (matchingIndices.has(index)) {
                segment.classList.remove("hidden"); // Show matching segment
              } else {
                segment.classList.add("hidden"); // Hide non-matching segment
              }
            });
            segmentHeaders.forEach((segment) => {
              segment.classList.add("hidden");
            });
          }

          function debounce(func: (...args: any[]) => void, delay: number) {
            let timeoutId: ReturnType<typeof setTimeout>;
            return function (this: any, ...args: any[]) {
              const context = this;
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                func.apply(context, args);
              }, delay);
            };
          }

          function addInputBox() {
            // Select the engagement panel section list renderer by target ID
            const engagementPanel = document.querySelector(
              'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
            );

            // Select the title header renderer within the engagement panel
            const titleHeaderRenderer = engagementPanel?.querySelector(
              "ytd-engagement-panel-title-header-renderer"
            );

            // Create the input element
            const inputBox = document.createElement("input");
            inputBox.setAttribute("type", "text");
            inputBox.setAttribute("placeholder", "Search transcript...");
            inputBox.setAttribute("id", "transcript-search-input");

            inputBox.style.width = "-webkit-fill-available"; // Set max width
            inputBox.style.padding = "8px"; // Add padding
            inputBox.style.borderRadius = "4px"; // Add border radius
            inputBox.addEventListener(
              "input",
              debounce(function () {
                // Call your search function here with the input value
                const query = inputBox.value.trim();
                searchAndFilterTranscriptSegments(query);
              }, 300)
            );

            // Append the input element to the title header renderer
            titleHeaderRenderer?.appendChild(inputBox);
          }

          // Call the function to add the input box
          addInputBox();
        },
      });
    }
    onLoad();
  }, []);
  return <div>You are now running the yt-video-summarizer</div>;
}

export default App;
