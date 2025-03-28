export function useSecondsFormatter(): (seconds: number) => {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  return (seconds) => {
    let secondsRemaining = seconds;
    const days = Math.floor(secondsRemaining / (24 * 60 * 60));
    secondsRemaining -= days * (24 * 60 * 60);
    const hours = Math.floor(secondsRemaining / (60 * 60));
    secondsRemaining -= hours * (60 * 60);
    const minutes = Math.floor(secondsRemaining / 60);
    secondsRemaining -= minutes * 60;
    return { days, hours, minutes, seconds: secondsRemaining };
  };
}
