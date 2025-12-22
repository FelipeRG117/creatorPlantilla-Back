/**
 * Concert DTO - Simplified
 * Mapeo directo del modelo MongoDB al interface del frontend
 */

export default class ConcertDTO {
  constructor(concert) {
    // ID (ya lo arreglaste)
    this.id = concert._id ? concert._id.toString() : concert.id;

    // Fecha en formato ISO (YYYY-MM-DD)
    const eventDate = concert.date instanceof Date ? concert.date : new Date(concert.date);
    this.date = eventDate.toISOString().split('T')[0];

    // Día de la semana (usar virtual del modelo o calcular)
    this.dayOfWeek = concert.dayOfWeek || this.getDayOfWeek(eventDate);

    // Mapeo directo de campos
    this.time = concert.time;
    this.venue = concert.venue;
    this.address = concert.address;
    this.city = concert.city;
    this.state = concert.state || undefined;
    this.country = concert.country;

    // Country flag (usar virtual del modelo o calcular)
    this.countryFlag = concert.countryFlag || this.getCountryFlag(concert.country);

    // Booleans
    this.hasTickets = concert.hasTickets || false;
    this.hasRSVP = concert.hasRSVP || false;
    this.soldOut = concert.soldOut || false;

    // URL opcional
    this.ticketUrl = concert.ticketUrl || undefined;
  }

  // Helper: calcular día de la semana
  getDayOfWeek(date) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }

  // Helper: obtener flag del país
  getCountryFlag(country) {
    const flags = {
      'México': '🇲🇽',
      'Mexico': '🇲🇽',
      'Estados Unidos': '🇺🇸',
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'España': '🇪🇸',
      'Spain': '🇪🇸',
      'Argentina': '🇦🇷',
      'Colombia': '🇨🇴',
      'Chile': '🇨🇱',
      'Perú': '🇵🇪',
      'Peru': '🇵🇪',
      'Brasil': '🇧🇷',
      'Brazil': '🇧🇷',
    };
    return flags[country] || '🌎';
  }
}
