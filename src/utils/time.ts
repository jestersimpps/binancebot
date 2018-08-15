export class Time {
  static now () {
    return Math.round(Date.now() / 1000)
  }

  static dateMinutesAgo (minutes: number) {
    const d = new Date()
    d.setMinutes(d.getMinutes() - minutes)
    return Math.round(d.getTime() / 1000)
  }
}
