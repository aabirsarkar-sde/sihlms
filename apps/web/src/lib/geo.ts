/** Seeded states and districts with approximate district-HQ coordinates (used for distance in match score). */
export const GEO: Record<string, Record<string, [number, number]>> = {
  Maharashtra: { Pune: [18.52, 73.86], Nashik: [19.99, 73.79], Nagpur: [21.15, 79.09], Kolhapur: [16.7, 74.24] },
  "Uttar Pradesh": { Lucknow: [26.85, 80.95], Varanasi: [25.32, 82.97], Meerut: [28.98, 77.71] },
  Bihar: { Patna: [25.59, 85.14], Gaya: [24.79, 85.0], Muzaffarpur: [26.12, 85.39] },
  "West Bengal": { Kolkata: [22.57, 88.36], Bardhaman: [23.23, 87.86], Nadia: [23.47, 88.56] },
  Gujarat: { Anand: [22.56, 72.95], Ahmedabad: [23.02, 72.57], Rajkot: [22.3, 70.8] },
  Rajasthan: { Jaipur: [26.91, 75.79], Udaipur: [24.59, 73.71], Jodhpur: [26.24, 73.02] },
  "Madhya Pradesh": { Bhopal: [23.26, 77.41], Indore: [22.72, 75.86], Jabalpur: [23.18, 79.95] },
  "Tamil Nadu": { Chennai: [13.08, 80.27], Madurai: [9.93, 78.12], Coimbatore: [11.02, 76.96] },
  Karnataka: { Bengaluru: [12.97, 77.59], Mysuru: [12.3, 76.64], Dharwad: [15.46, 75.01] },
  Kerala: { Thiruvananthapuram: [8.52, 76.94], Kozhikode: [11.26, 75.78], Thrissur: [10.53, 76.21] },
  Odisha: { Bhubaneswar: [20.3, 85.82], Cuttack: [20.46, 85.88], Sambalpur: [21.47, 83.97] },
  Punjab: { Ludhiana: [30.9, 75.86], Amritsar: [31.63, 74.87], Patiala: [30.34, 76.39] },
  Haryana: { Karnal: [29.69, 76.99], Hisar: [29.15, 75.72], Rohtak: [28.9, 76.61] },
  Assam: { Guwahati: [26.14, 91.74], Jorhat: [26.75, 94.2], Dibrugarh: [27.47, 94.91] },
  Telangana: { Hyderabad: [17.39, 78.49], Warangal: [17.97, 79.59], Karimnagar: [18.44, 79.13] },
};

export const STATES = Object.keys(GEO);

export function districtCoords(state: string, district: string): [number, number] | null {
  return GEO[state]?.[district] ?? null;
}

export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Approximate map positions (0-100 grid) of each state for the heat map tile view. */
export const STATE_TILE: Record<string, [number, number]> = {
  Punjab: [2, 2], Haryana: [3, 3], "Uttar Pradesh": [5, 4], Bihar: [7, 4], Assam: [10, 3],
  Rajasthan: [2, 5], "Madhya Pradesh": [4, 6], "West Bengal": [8, 6], Gujarat: [1, 7], Odisha: [7, 7],
  Maharashtra: [3, 8], Telangana: [5, 9], Karnataka: [3, 10], "Tamil Nadu": [5, 11], Kerala: [3, 12],
};
