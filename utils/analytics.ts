/**
 * Tracks a link click or button interaction event
 * @param eventLabel The specific action or element that was clicked
 * @param eventCategory The category of the event (default: 'primary')
 * @param eventValue Optional numeric value associated with the event (default: 1)
 */
export function trackLinkClick(eventLabel: string, eventCategory: string = 'primary', eventValue: number = 1): void {
  console.log('trackLinkClick', eventLabel, eventCategory, eventValue, (window as any).gtag);
  
  if ((window as any).gtag) {
    (window as any).gtag('event', eventLabel, {
      event_category: eventCategory,
      event_label: eventLabel,
      value: eventValue
    });
  }
}

/**
 * Tracks a general custom event
 * @param eventName The name of the event
 * @param parameters Additional event parameters
 */
export function trackEvent(eventName: string, parameters: Record<string, any> = {}): void {
  console.log('trackEvent', eventName, parameters, (window as any).gtag);
  
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
}
