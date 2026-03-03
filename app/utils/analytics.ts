/**
 * Tracks a link click or button interaction event
 * @param eventLabel The specific action or element that was clicked
 * @param eventCategory The category of the event (default: 'primary')
 * @param eventValue Optional numeric value associated with the event (default: 1)
 */
export function trackLinkClick(
  eventLabel: string,
  eventCategory: string = "primary",
  eventValue: number = 1
): void {
  try {
  if (process.env.NODE_ENV === "production") {
    useTrackEvent(eventLabel, {
      event_category: eventCategory,
      event_label: eventLabel,
      value: eventValue,
    });
    }
  } catch (error) {
    console.error("Error tracking event:", error);
  }
}

/**
 * Tracks a general custom event
 * @param eventName The name of the event
 * @param parameters Additional event parameters
 */
export function trackEvent(
  eventName: string,
  parameters: Record<string, any> = {}
): void {
  try {
    if (process.env.NODE_ENV === "production") {
      let contextParams: Record<string, any> = {};

      if (typeof window !== "undefined") {
        try {
          const searchParams = new URLSearchParams(
            window.location.search || ""
          );
          const urlContext = searchParams.get("context");
          let contextValue: string | null = null;

          if (urlContext) {
            contextValue = urlContext;
            try {
              window.sessionStorage.setItem("nosana_context", urlContext);
            } catch {
              // Ignore sessionStorage errors
            }
          } else {
            try {
              contextValue = window.sessionStorage.getItem("nosana_context");
            } catch {
              // Ignore sessionStorage errors
            }
          }

          if (contextValue && !("context" in parameters)) {
            contextParams = { context: contextValue };
          }
        } catch {
          // Ignore URL parsing errors and fall back to original parameters
        }
      }

      useTrackEvent(eventName, {
        ...parameters,
        ...contextParams,
      });
    }
  } catch (error) {
    console.error("Error tracking event:", error);
  }
}
