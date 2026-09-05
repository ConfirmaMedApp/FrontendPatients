import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ArrowRight, Stethoscope } from 'lucide-react';

import { getSpecialities } from '@/lib/api';

export default function AppointmentForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    fecha: '',
    especialidad: '',
    especialidadNombre: '',
    horaInicial: '',
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [especialidadesError, setEspecialidadesError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEspecialidades = async () => {
      setLoadingEspecialidades(true);
      setEspecialidadesError('');
      try {
        const list = await getSpecialities();
        if (Array.isArray(list) && list.length > 0) setEspecialidades(list);
        else setEspecialidades([]);
      } catch (err) {
        console.error('Error cargando especialidades:', err);
        setEspecialidadesError('No se pudieron cargar las especialidades. Intenta nuevamente.');
      } finally {
        setLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.fecha);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.fecha = 'La fecha no puede ser anterior a hoy';
      }
    }

    if (!formData.especialidad) {
      newErrors.especialidad = 'La especialidad es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Obtener la fecha mínima (hoy)
  const today = new Date();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 flex flex-col md:flex-row md:space-y-0 md:space-x-4">
        {/* Fecha */}
        <div className="space-y-2 w-full">
          <Label htmlFor="fecha" className="text-base">
            Fecha de la Cita *
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={false}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative w-full text-left border rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Seleccionar fecha"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>
                    {formData.fecha
                      ? new Date(formData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Selecciona una fecha'}
                  </span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.fecha ? new Date(formData.fecha + 'T00:00:00') : undefined}
                onSelect={(date) => {
                  if (date) {
                    // Solo permitir fechas desde hoy en adelante
                    const minDate = new Date();
                    minDate.setHours(0, 0, 0, 0);
                    if (date >= minDate) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      handleChange('fecha', `${year}-${month}-${day}`);
                      setCalendarOpen(false);
                    }
                  }
                }}
                disabled={(date) => date < today}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.fecha && (
            <p className="text-sm text-red-500">{errors.fecha}</p>
          )}
        </div>

        {/* Especialidad y Hora Inicial */}
        <div className="space-y-2 w-full flex gap-3">
          <div className="space-y-2 flex-1">
            <Label htmlFor="especialidad" className="text-base">
              Especialidad Médica *
            </Label>
            <Select
              value={formData.especialidad}
              onValueChange={(value) => {
                handleChange('especialidad', value);
                // Guardar también el nombre de la especialidad
                const selectedEsp = especialidades.find(esp => esp.value === value);
                if (selectedEsp) {
                  handleChange('especialidadNombre', selectedEsp.label);
                }
              }}
              onOpenChange={(open) => {
                if (open && calendarOpen) {
                  setCalendarOpen(false);
                }
              }}
            >
              <SelectTrigger
                className={`w-full px-4 py-5 h-auto text-base ${errors.especialidad ? 'border-red-500' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <SelectValue placeholder="Selecciona una especialidad" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {loadingEspecialidades ? (
                  <div className="p-4 text-sm text-gray-500">Cargando especialidades...</div>
                ) : especialidadesError ? (
                  <div className="p-4 text-sm text-red-500">{especialidadesError}</div>
                ) : (especialidades.length > 0 ? (
                  especialidades.map((esp) => (
                    <SelectItem key={esp.value} value={esp.value}>
                      {esp.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-500">No hay especialidades disponibles</div>
                ))}
              </SelectContent>
            </Select>
            {errors.especialidad && (
              <p className="text-sm text-red-500">{errors.especialidad}</p>
            )}
          </div>

          {/* Hora Inicial */}
          <div className="space-y-2" style={{ width: '140px' }}>
            <Label htmlFor="horaInicial" className="text-base whitespace-nowrap">
              Hora
            </Label>
            <Input
              id="horaInicial"
              type="time"
              value={formData.horaInicial}
              onChange={(e) => handleChange('horaInicial', e.target.value)}
              className="px-3 py-2.5 h-auto text-base"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg">
        Continuar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
}
