"use client";

import {
  Wifi, Waves, Trees, ChefHat, Flame, ParkingCircle, PawPrint, AirVent,
  Tv, Coffee, Snowflake, Sun, BedDouble, Bath, Dumbbell, Bike,
  Fish, Flower2, Wind, Star, ShowerHead, Utensils, Car, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Wifi, Waves, Trees, ChefHat, Flame, ParkingCircle, PawPrint, AirVent,
  Tv, Coffee, Snowflake, Sun, BedDouble, Bath, Dumbbell, Bike,
  Fish, Flower2, Wind, Star, ShowerHead, Utensils, Car, MapPin,
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-3 border border-[#1C3A2A]/10 bg-[#FAF7F2]">
      {Object.entries(ICON_MAP).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          className={cn(
            "flex flex-col items-center justify-center p-2 gap-1 transition-colors hover:bg-[#1C3A2A]/5",
            value === name && "bg-[#1C3A2A]/10 ring-1 ring-[#B8963E]"
          )}
        >
          <Icon className="w-5 h-5 text-[#1C3A2A]" strokeWidth={1.5} />
          <span className="text-[8px] text-[#1C3A2A]/40 uppercase tracking-wider truncate w-full text-center">
            {name}
          </span>
        </button>
      ))}
    </div>
  );
}
