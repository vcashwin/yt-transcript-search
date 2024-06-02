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
                textElement.textContent
                  ?.toLowerCase()
                  .includes(query.toLowerCase())
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

          const removeExistingSearchBox = () => {
            const existingSearchBox = document.querySelector(
              "ytd-transcript-search-box-renderer"
            );
            if (existingSearchBox) {
              existingSearchBox.remove();
              return true; // Indicate that the search box was found and removed
            }
            return false;
          };

          // Use MutationObserver to watch for changes to the DOM and remove the search box immediately
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length > 0) {
                if (removeExistingSearchBox()) {
                  // If the search box is found and removed, disconnect the observer
                  observer.disconnect();
                }
              }
            });
          });

          // Start observing the document for added nodes
          observer.observe(document.body, { childList: true, subtree: true });
          function addInputBox() {
            // Select the engagement panel section list renderer by target ID
            const engagementPanel = document.querySelector(
              'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
            );

            // Select the title header renderer within the engagement panel
            const titleHeaderRenderer = engagementPanel?.querySelector(
              "ytd-engagement-panel-title-header-renderer"
            );

            // Remove the existing search box element if it exists
            const existingSearchBox = document?.querySelector(
              "ytd-transcript-search-box-renderer"
            );
            if (existingSearchBox) {
              existingSearchBox.remove();
            }

            if (
              titleHeaderRenderer?.querySelector(
                ".custom-transcript-search-box"
              )
            ) {
              return;
            }

            // Create the div element
            const inputContainer = document.createElement("div");

            // Style the div container
            inputContainer.classList.add("custom-transcript-search-box"); // Set ID
            inputContainer.style.width = "100%"; // Set max width
            inputContainer.style.color = "var(--yt-spec-text-primary)"; // Set text color
            inputContainer.style.backgroundColor =
              "var(--yt-spec-brand-background-primary)"; // Set background color
            inputContainer.style.paddingBottom = "8px";

            // Create the input element
            const inputBox = document.createElement("input");
            inputBox.setAttribute("type", "text");
            inputBox.setAttribute(
              "placeholder",
              "Search for keyword in video..."
            );

            // Style the input box
            inputBox.style.width = "-webkit-fill-available"; // Set max width
            inputBox.style.padding = "12px"; // Add padding
            inputBox.style.margin = "0 16px"; // Add margin
            inputBox.style.borderRadius = "4px"; // Add border radius
            inputBox.style.borderWidth = "0px"; // Add border width
            inputBox.style.backgroundColor =
              "var(--yt-spec-badge-chip-background)"; // Set background color
            inputBox.style.color = "var(--yt-spec-text-primary)"; // Set text color
            inputBox.style.caretColor = "var(--yt-spec-themed-blue)"; // Set caret color

            // Add debounce to the input event listener
            inputBox.addEventListener(
              "input",
              debounce(function () {
                // Call your search function here with the input value
                const query = inputBox.value.trim();
                searchAndFilterTranscriptSegments(query);
              }, 300)
            ); // Adjust debounce delay as needed

            // Append the input element to the div container
            inputContainer.appendChild(inputBox);

            // Append the div container to the title header renderer
            titleHeaderRenderer?.appendChild(inputContainer);
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
