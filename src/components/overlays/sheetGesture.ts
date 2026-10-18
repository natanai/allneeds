export function shouldDismissSheet(distance: number, horizontal: number, velocity: number) {
  return distance > Math.abs(horizontal)
    && (distance >= 72 || (distance >= 24 && velocity >= .65));
}
