import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Calendar, Stethoscope, Check, Mail, Home, Download } from 'lucide-react';
import { getAvailableSlots, assignAppointment } from '@/lib/api';

// Los horarios se cargan desde el endpoint público

export default function ScheduleSelector({ onSubmit, onBack, appointmentData, patientData }) {
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [showingRecommendations, setShowingRecommendations] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(appointmentData?.fecha || '');
  const [newHoraInicial, setNewHoraInicial] = useState('');
  const [tempDate, setTempDate] = useState(null);
  const confirmationRef = useRef(null);

  const handleDownloadConfirmation = async () => {
    try {
      // Create canvas manually
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 1200; // 600px * 2 for high resolution
      canvas.height = 1000;
      
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text properties
      ctx.textAlign = 'center';
      
      // Draw check circle
      ctx.beginPath();
      ctx.arc(600, 120, 80, 0, 2 * Math.PI);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.stroke();
      
      // Draw check mark
      ctx.font = 'bold 96px system-ui, Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText('✓', 600, 150);
      
      // Draw title
      ctx.font = 'bold 48px system-ui, Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText('¡Cita Agendada Exitosamente!', 600, 280);
      
      // Draw subtitle
      ctx.font = '28px system-ui, Arial';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('Hemos enviado la confirmación de tu cita a tu correo electrónico.', 600, 330);
      
      // Draw info box
      const boxX = 200;
      const boxY = 380;
      const boxWidth = 800;
      const boxHeight = 380;
      
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Draw content inside box
      ctx.textAlign = 'left';
      let currentY = boxY + 60;
      
      // Fecha y Hora
      ctx.font = '600 24px system-ui, Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('FECHA Y HORA', boxX + 40, currentY);
      currentY += 40;
      ctx.font = '600 32px system-ui, Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(`${formatDate(currentDate)} a las ${selectedTime}`, boxX + 40, currentY);
      currentY += 40;
      
      // Line separator
      ctx.beginPath();
      ctx.moveTo(boxX + 40, currentY);
      ctx.lineTo(boxX + boxWidth - 40, currentY);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.stroke();
      currentY += 40;
      
      // Especialidad
      ctx.font = '600 24px system-ui, Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('ESPECIALIDAD', boxX + 40, currentY);
      currentY += 40;
      ctx.font = '600 32px system-ui, Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(appointmentData.especialidadNombre || getEspecialidadLabel(appointmentData.especialidad), boxX + 40, currentY);
      currentY += 40;
      
      // Line separator
      ctx.beginPath();
      ctx.moveTo(boxX + 40, currentY);
      ctx.lineTo(boxX + boxWidth - 40, currentY);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.stroke();
      currentY += 40;
      
      // Email
      ctx.font = '600 24px system-ui, Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('CONFIRMACIÓN ENVIADA A', boxX + 40, currentY);
      currentY += 40;
      ctx.font = '600 32px system-ui, Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(patientData.email, boxX + 40, currentY);
      
      // Footer text
      ctx.textAlign = 'center';
      ctx.font = 'italic 26px system-ui, Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Por favor, llega 10 minutos antes de tu cita', 600, 840);
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `confirmacion-cita-${currentDate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Error al descargar la confirmación:', err);
      alert('Hubo un error al descargar la confirmación. Por favor, intenta nuevamente.');
    }
  };

  useEffect(() => {
    // Cargar horarios cuando cambian fecha o especialidad
    const fetchSlots = async () => {
      const { especialidad, horaInicial } = appointmentData || {};
      if (!currentDate || !especialidad) return;
      setLoadingSlots(true);
      setSlotsError('');
      setShowingRecommendations(false);
      setSelectedTime(''); // Reset selected time when date changes
      try {
        const result = await getAvailableSlots(especialidad, currentDate, horaInicial || null);
        const slots = result.slots || [];
        
        if (result.usedRecommendations) {
          setShowingRecommendations(true);
        }
        
        if (Array.isArray(slots) && slots.length > 0) {
          setTimeSlots(slots);
        } else {
          setTimeSlots([]);
        }
      } catch (err) {
        console.error('Error cargando horarios:', err);
        setSlotsError('No se pudieron cargar los horarios. Intenta nuevamente.');
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [currentDate, appointmentData]);

  const handleDateChange = () => {
    if (tempDate) {
      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      if (tempDate >= minDate) {
        const year = tempDate.getFullYear();
        const month = String(tempDate.getMonth() + 1).padStart(2, '0');
        const day = String(tempDate.getDate()).padStart(2, '0');
        setCurrentDate(`${year}-${month}-${day}`);
        
        // Actualizar la hora inicial en appointmentData si se cambió
        if (newHoraInicial) {
          appointmentData.horaInicial = newHoraInicial;
        }
        
        setShowDateModal(false);
        setNewHoraInicial(''); // Reset el campo
        setTempDate(null);
      }
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime) return;

    setIsSubmitting(true);
    
    try {
      // Encontrar el slot seleccionado para obtener el appointmentId
      const selectedSlot = timeSlots.find(slot => slot.time === selectedTime);
      if (!selectedSlot || !selectedSlot.id) {
        throw new Error('No se encontró el ID de la cita');
      }
      
      // Verificar que el patientId esté disponible
      const patientId = patientData?.id || patientData?.patientId;
      if (!patientId) {
        throw new Error('No se encontró el ID del paciente');
      }
      
      // Asignar la cita con appointmentId y patientId
      await assignAppointment(selectedSlot.id, patientId);
      
      setIsSubmitting(false);
      setShowConfirmation(true);
    } catch (err) {
      console.error('Error al agendar la cita:', err);
      alert(`Hubo un error al agendar la cita: ${err.message}. Por favor, intenta nuevamente.`);
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    // Llamar inmediatamente sin demoras
    onSubmit({ ...appointmentData, fecha: currentDate, ...patientData, horario: selectedTime });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEspecialidadLabel = (value) => {
    const especialidades = {
      'medicina-general': 'Medicina General',
      'cardiologia': 'Cardiología',
      'dermatologia': 'Dermatología',
      'pediatria': 'Pediatría',
      'ginecologia': 'Ginecología',
      'traumatologia': 'Traumatología',
      'oftalmologia': 'Oftalmología',
      'neurologia': 'Neurología',
      'psiquiatria': 'Psiquiatría',
      'urologia': 'Urología',
    };
    return especialidades[value] || value;
  };

  if (showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            ¡Cita Agendada Exitosamente!
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Hemos enviado la confirmación de tu cita a tu correo electrónico.
          </p>

          {/* Detalles de la cita */}
          <Card className="bg-blue-50 border-blue-200 max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Fecha y Hora</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatDate(currentDate)} a las {selectedTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Especialidad</p>
                    <p className="text-base font-semibold text-gray-900">
                      {appointmentData.especialidadNombre || getEspecialidadLabel(appointmentData.especialidad)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Confirmación enviada a</p>
                    <p className="text-base font-semibold text-gray-900">
                      {patientData.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-4">
              Por favor, llega 10 minutos antes de tu cita
            </p>
          </div>
        </div>

        {/* Botones fuera del área de captura */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Button
            onClick={handleDownloadConfirmation}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Descargar
          </Button>
          <Button
            onClick={handleBackToHome}
            className="flex-1"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selección de horario */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Selecciona un horario disponible</h3>
        </div>

        {showingRecommendations && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              No se encontraron citas disponibles a la hora solicitada. Se muestran horarios recomendados.
            </p>
          </div>
        )}

        {loadingSlots ? (
          <p className="text-center text-gray-500 py-4">Cargando horarios...</p>
        ) : slotsError ? (
          <p className="text-center text-red-500 py-4">{slotsError}</p>
        ) : timeSlots.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.time)}
                className={`
                  py-3 px-4 rounded-lg border-2 transition-all font-medium
                  ${!slot.available 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : selectedTime === slot.time
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
              >
                {slot.time}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <p className="text-gray-500">
              No hay horarios disponibles para esta fecha.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDateModal(true)}
              className="mx-auto"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Cambiar fecha
            </Button>
          </div>
        )}
      </div>

      {/* Modal para cambiar fecha */}
      <Dialog open={showDateModal} onOpenChange={setShowDateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Cambiar fecha de la cita</DialogTitle>
            <DialogDescription>
              Selecciona una nueva fecha y opcionalmente una hora específica
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Calendar */}
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <CalendarComponent
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                initialFocus
              />
            </div>
            
            {/* Hora opcional */}
            <div className="space-y-2">
              <Label htmlFor="newHoraInicial" className="text-sm font-semibold text-gray-700">
                Hora inicial (opcional)
              </Label>
              <Input
                id="newHoraInicial"
                type="time"
                value={newHoraInicial}
                onChange={(e) => setNewHoraInicial(e.target.value)}
                placeholder="HH:MM"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Deja en blanco para ver todas las horas disponibles
              </p>
            </div>
            
            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDateModal(false);
                  setTempDate(null);
                  setNewHoraInicial('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDateChange}
                className="flex-1"
                disabled={!tempDate}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Buscar horarios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Atrás
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          className="flex-1"
          size="lg"
          disabled={!selectedTime || isSubmitting}
        >
          {isSubmitting ? (
            'Confirmando...'
          ) : (
            <>
              Confirmar Cita
              <Check className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
