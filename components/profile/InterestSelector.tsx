"use client"

import { useState } from "react"
import { Heart, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpecialtySelectorProps {
  selectedSpecialties: string[]
  onSpecialtiesChange: (specialties: string[]) => void
  maxSelections?: number
}

const availableSpecialties = [
  "Manipulación de Cartas", "Monedas", "Mentalismo", "Ilusionismo de Escenario",
  "Magia Cercana", "Escapología", "Levitación", "Transformación",
  "Predicción", "Telepatía", "Ilusiones Ópticas", "Grandes Ilusiones"
]

export function SpecialtySelector({ 
  selectedSpecialties, 
  onSpecialtiesChange, 
  maxSelections = 12 
}: SpecialtySelectorProps) {
  const [customSpecialty, setCustomSpecialty] = useState("")

  const handleToggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      onSpecialtiesChange(selectedSpecialties.filter(s => s !== specialty))
    } else if (selectedSpecialties.length < maxSelections) {
      onSpecialtiesChange([...selectedSpecialties, specialty])
    }
  }

  const handleAddCustomSpecialty = () => {
    if (customSpecialty.trim() && 
        !availableSpecialties.includes(customSpecialty.trim()) && 
        !selectedSpecialties.includes(customSpecialty.trim()) &&
        selectedSpecialties.length < maxSelections) {
      onSpecialtiesChange([...selectedSpecialties, customSpecialty.trim()])
      setCustomSpecialty("")
    }
  }

  const handleRemoveSpecialty = (specialty: string) => {
    onSpecialtiesChange(selectedSpecialties.filter(s => s !== specialty))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[oklch(0.85_0.01_250)]">Mis Especialidades</h3>
        <span className="text-sm text-[oklch(0.6_0.01_250)]">
          {selectedSpecialties.length}/{maxSelections}
        </span>
      </div>

      {/* Selected Specialties */}
      {selectedSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSpecialties.map((specialty) => (
            <div
              key={specialty}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[oklch(0.72_0.18_55)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] border border-[oklch(0.72_0.18_55/0.3)] transition-all duration-300 hover:shadow-[0_4px_20px_oklch(0.72_0.18_55/0.4)]"
            >
              <Heart className="size-3 fill-current" />
              <span className="text-sm font-medium">{specialty}</span>
              <button
                onClick={() => handleRemoveSpecialty(specialty)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available Specialties */}
      <div className="space-y-3">
        <p className="text-sm text-[oklch(0.6_0.01_250)]">
          Selecciona tus especialidades (máximo {maxSelections}):
        </p>
        
        <div className="flex flex-wrap gap-2">
          {availableSpecialties.map((specialty) => {
            const isSelected = selectedSpecialties.includes(specialty)
            const isDisabled = !isSelected && selectedSpecialties.length >= maxSelections
            
            return (
              <button
                key={specialty}
                onClick={() => handleToggleSpecialty(specialty)}
                disabled={isDisabled}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border",
                  isSelected
                    ? "bg-gradient-to-r from-[oklch(0.72_0.18_55)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] border-[oklch(0.72_0.18_55/0.3)] shadow-[0_2px_10px_oklch(0.72_0.18_55/0.2)]"
                    : isDisabled
                    ? "bg-[oklch(0.1_0.02_250)] text-[oklch(0.4_0.01_250)] border-[oklch(0.15_0.03_250)] cursor-not-allowed"
                    : "bg-[oklch(0.1_0.02_250)] text-[oklch(0.7_0.01_250)] border-[oklch(0.2_0.03_250)] hover:bg-[oklch(0.72_0.18_55/0.1)] hover:text-[oklch(0.72_0.18_55)] hover:border-[oklch(0.72_0.18_55/0.3)]"
                )}
              >
                <span className="flex items-center gap-1">
                  {isSelected && <Heart className="size-3 fill-current" />}
                  {specialty}
                </span>
              </button>
            )
          })}
        </div>

        {/* Custom Specialty Input */}
        <div className="flex gap-2 pt-2 border-t border-[oklch(0.2_0.03_250)]">
          <input
            type="text"
            value={customSpecialty}
            onChange={(e) => setCustomSpecialty(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSpecialty()}
            placeholder="Agregar especialidad personalizada..."
            className="flex-1 px-3 py-2 rounded-xl bg-[oklch(0.1_0.02_250)] border border-[oklch(0.2_0.03_250)] text-[oklch(0.85_0.01_250)] placeholder-[oklch(0.5_0.01_250)] focus:outline-none focus:border-[oklch(0.72_0.18_55)] focus:ring-2 focus:ring-[oklch(0.72_0.18_55/0.2)] text-sm"
          />
          <button
            onClick={handleAddCustomSpecialty}
            disabled={!customSpecialty.trim() || selectedSpecialties.length >= maxSelections}
            className={cn(
              "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
              customSpecialty.trim() && selectedSpecialties.length < maxSelections
                ? "bg-gradient-to-r from-[oklch(0.72_0.18_55)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] hover:shadow-[0_4px_20px_oklch(0.72_0.18_55/0.4)]"
                : "bg-[oklch(0.1_0.02_250)] text-[oklch(0.5_0.01_250)] cursor-not-allowed"
            )}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
