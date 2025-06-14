import React, { createContext, useContext, useState } from "react";

interface TemperatureContextType {
  isCelsius: boolean;
  toggleUnit: () => void;
  convertTemp: (temp: number) => number;
  getTempUnit: () => string;
}

const TemperatureContext = createContext<TemperatureContextType | undefined>(
  undefined
);

export function TemperatureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCelsius, setIsCelsius] = useState(true);

  const toggleUnit = () => setIsCelsius(!isCelsius);

  const convertTemp = (temp: number) => {
    return isCelsius ? temp : (temp * 9) / 5 + 32;
  };

  const getTempUnit = () => (isCelsius ? "°C" : "°F");

  return (
    <TemperatureContext.Provider
      value={{ isCelsius, toggleUnit, convertTemp, getTempUnit }}
    >
      {children}
    </TemperatureContext.Provider>
  );
}

export function useTemperature() {
  const context = useContext(TemperatureContext);
  if (context === undefined) {
    throw new Error("useTemperature must be used within a TemperatureProvider");
  }
  return context;
}
