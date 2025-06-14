// File: /api/send-personalized-weather.ts
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as Location from 'expo-location';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { data: tokens, error } = await supabase
    .from('device_tokens')
    .select('token, latitude, longitude');

  if (error) return new Response("❌ Failed to fetch tokens", { status: 500 });

  const messages = await Promise.all(
    tokens.map(async ({ token, latitude, longitude }) => {
      const lat = latitude ?? 28.61; // fallback to Delhi
      const lon = longitude ?? 77.20;

      // Get city name using reverse geocoding
      const [address] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      const cityName = address?.city || 'Your location';

      // Get current hour
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour <= 6;
      const isMorning = hour >= 5 && hour < 12;
      const isAfternoon = hour >= 12 && hour < 17;
      const isEvening = hour >= 17 && hour < 22;

      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
      );

      const weather = weatherRes.data.current;
      const timeContext = getTimeBasedContext(isNight, isMorning, isAfternoon, isEvening);
      const vibeMsg = getFunnyForecast(weather.temperature_2m, weather.weathercode, cityName, timeContext);
      const randomMsg = getRandomAnalogy();

      return [
        {
          to: token,
          sound: 'default',
          title: `📍 ${cityName} Weather Update`,
          body: vibeMsg,
        },
        {
          to: token,
          sound: 'default',
          title: '🌀 Thought of the Hour',
          body: randomMsg,
        },
      ];
    })
  );

  const flatMessages = messages.flat();

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(flatMessages),
  });

  return new Response('✅ Sent custom weird weather & wisdom blasts', { status: 200 });
}

function getTimeBasedContext(isNight: boolean, isMorning: boolean, isAfternoon: boolean, isEvening: boolean): string {
  if (isNight) return "night";
  if (isMorning) return "morning";
  if (isAfternoon) return "afternoon";
  if (isEvening) return "evening";
  return "day";
}

function getFunnyForecast(temp: number, code: number, cityName: string, timeContext: string): string {
  const timePrefix = {
    night: "🌙 Tonight in",
    morning: "🌅 Good morning from",
    afternoon: "☀️ Afternoon in",
    evening: "🌆 Evening in",
    day: "🌤️ In"
  }[timeContext];

  if (code === 0) return `${timePrefix} ${cityName}: Sun's out, no excuses to stay in bed (but we support it).`;
  if ([61, 63, 65].includes(code)) return `${timePrefix} ${cityName}: Umbrella? Nah, just vibe in the rain.`;
  if ([95, 96, 99].includes(code)) return `${timePrefix} ${cityName}: Sky's angry. Maybe you're the chosen one today.`;
  if (temp > 35) return `${timePrefix} ${cityName}: It's a toaster outside. Don't become toast.`;
  if (temp < 10) return `${timePrefix} ${cityName}: Shiver me timbers, it's cold AF. Don't forget to wear a jacket.`;
  return `${timePrefix} ${cityName}: Just a regular day to make legendary choices.`;
}

function getRandomAnalogy() {
  const analogies = [
    "Weather changes fast — just like people's mood at Monday 9 AM.",
    "Today's forecast: 100% chance of slay, even if it rains.",
    "Cloudy minds need sunny walks.",
    "Life is like weather: mostly unpredictable, occasionally stormy, always beautiful.",
    "Even the storm ends — unless you're in finals week.",
    "Humidity is just the earth's way of asking for a spa day.",
    "Forecast says: bring good vibes not umbrellas."
  ];
  return analogies[Math.floor(Math.random() * analogies.length)];
}
