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
          enum SELECTORS {
            ExpandButton = "#expand",
            TranscriptButton = '[aria-label="Show transcript"]',
            SegmentsContainer = "#segments-container ytd-transcript-segment-renderer",
            SegmentHeaders = "#segments-container ytd-transcript-section-header-renderer",
            SearchBox = "ytd-transcript-search-box-renderer",
            EngagementPanel = 'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]',
            TitleHeader = "ytd-engagement-panel-title-header-renderer",
            CustomTranscriptSearchBox = ".custom-transcript-search-box",
            SegmentText = "yt-formatted-string.segment-text",
          }

          function clickElement(selector: SELECTORS) {
            const element = document.querySelector(selector) as HTMLElement;
            element?.click();
          }

          function findElement(selector: SELECTORS, node?: Element | null) {
            return (node ?? document).querySelector(selector);
          }

          function findElements(selector: SELECTORS, node?: Element | null) {
            return (node ?? document).querySelectorAll(selector);
          }

          function searchAndFilterTranscriptSegments(query: string) {
            const segments = findElements(SELECTORS.SegmentsContainer);
            const segmentHeaders = findElements(SELECTORS.SegmentHeaders);
            if (query === "") {
              // If the query is empty, show all segments
              segments.forEach((segment) => {
                segment.classList.remove("hidden");
              });
              segmentHeaders.forEach((segment) => {
                segment.classList.remove("hidden");
              });
              return;
            }
            const matchingIndices = new Map();
            segments.forEach((segment, index) => {
              const textElement = findElement(SELECTORS.SegmentText, segment);
              if (
                textElement?.textContent
                  ?.toLowerCase()
                  .includes(query.toLowerCase())
              ) {
                matchingIndices.set(index, true);
              }
            });

            segments.forEach((segment, index) => {
              if (matchingIndices.has(index)) {
                segment.classList.remove("hidden");
              } else {
                segment.classList.add("hidden");
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
            const engagementPanel = findElement(SELECTORS.EngagementPanel);
            const titleHeaderRenderer = findElement(
              SELECTORS.TitleHeader,
              engagementPanel
            );

            const existingSearchBox = findElement(SELECTORS.SearchBox);
            if (existingSearchBox) {
              existingSearchBox.remove();
            }

            const customTranscriptSearchBox = findElement(
              SELECTORS.CustomTranscriptSearchBox
            );
            if (customTranscriptSearchBox) {
              return;
            }

            const inputContainer = document.createElement("div");
            inputContainer.classList.add("custom-transcript-search-box");
            inputContainer.style.width = "100%";
            inputContainer.style.color = "var(--yt-spec-text-primary)";
            inputContainer.style.backgroundColor =
              "var(--yt-spec-brand-background-primary)";
            inputContainer.style.paddingBottom = "8px";

            const inputBox = document.createElement("input");
            inputBox.setAttribute("type", "text");
            inputBox.setAttribute(
              "placeholder",
              "Search for keyword in video..."
            );

            inputBox.style.width = "-webkit-fill-available";
            inputBox.style.padding = "12px";
            inputBox.style.margin = "0 16px";
            inputBox.style.borderRadius = "4px";
            inputBox.style.borderWidth = "0px";
            inputBox.style.backgroundColor =
              "var(--yt-spec-badge-chip-background)";
            inputBox.style.color = "var(--yt-spec-text-primary)";
            inputBox.style.caretColor = "var(--yt-spec-themed-blue)";

            inputBox.addEventListener(
              "input",
              debounce(function () {
                const query = inputBox.value.trim();
                searchAndFilterTranscriptSegments(query);
              }, 300)
            );

            inputContainer.appendChild(inputBox);
            titleHeaderRenderer?.appendChild(inputContainer);
          }

          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length > 0) {
                const existingSearchBox = findElement(SELECTORS.SearchBox);
                if (existingSearchBox) {
                  existingSearchBox.remove();
                  observer.disconnect();
                }
              }
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });

          clickElement(SELECTORS.ExpandButton);
          clickElement(SELECTORS.TranscriptButton);
          addInputBox();
        },
      });
    }
    onLoad();
  }, []);
  return <div>You are now running the yt-transcript-search</div>;
}

export default App;
