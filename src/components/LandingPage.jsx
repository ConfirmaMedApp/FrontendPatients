import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Stethoscope, UserCheck, Clock } from 'lucide-react';
import AppointmentForm from './AppointmentForm';
import PatientForm from './PatientForm';
import ScheduleSelector from './ScheduleSelector';

export default function LandingPage() {
  const [step, setStep] = useState(1);
  const [appointmentData, setAppointmentData] = useState({
    fecha: '',
    especialidad: '',
  });
  const [patientData, setPatientData] = useState({
    cedula: '',
    nombre: '',
    telefono: '',
    email: '',
  });

  const handleAppointmentSubmit = (data) => {
    setAppointmentData(data);
    setStep(2);
  };

  const handlePatientSubmit = (data) => {
    // Asegurarse de que el patientId esté disponible en patientData
    setPatientData({
      ...data,
      id: data.patientId || data.id, // Guardar el ID del paciente
    });
    setStep(3);
  };

  const handleScheduleSubmit = (data) => {
    // Aquí puedes procesar la cita completa
    console.log('Cita completa:', data);
    // Reset después de 3 segundos
    setTimeout(() => {
      setStep(1);
      setAppointmentData({ fecha: '', especialidad: '' });
      setPatientData({ cedula: '', nombre: '', telefono: '', email: '' });
    }, 3000);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <div className="h-screen overflow-x-hidden bg-linear-to-b from-blue-100 via-white to-blue-50">

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 ">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 flex gap-2 justify-center items-center">
              <h1>ConfirmaMed</h1>
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
              Programa tu consulta de manera rápida y sencilla. Selecciona la especialidad y fecha que mejor se ajuste a tus necesidades.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="hidden md:inline font-medium">Fecha</span>
              </div>
              <div className={`w-6 md:w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                  <UserCheck className="h-5 w-5" />
                </div>
                <span className="hidden md:inline font-medium">Paciente</span>
              </div>
              <div className={`w-6 md:w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                  <Clock className="h-5 w-5" />
                </div>
                <span className="hidden md:inline font-medium">Horario</span>
              </div>
            </div>
          </div>

          {/* Forms */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 ? 'Información de la Cita' : step === 2 ? 'Datos del Paciente' : 'Selección de Horario'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Selecciona la fecha y especialidad médica que necesitas' 
                  : step === 2 
                    ? 'Completa tus datos para continuar'
                    : 'Elige el horario que mejor se ajuste a tu disponibilidad'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 ? (
                <AppointmentForm onSubmit={handleAppointmentSubmit} />
              ) : step === 2 ? (
                <PatientForm 
                  onSubmit={handlePatientSubmit} 
                  onBack={handleBack}
                  appointmentData={appointmentData}
                />
              ) : (
                <ScheduleSelector
                  onSubmit={handleScheduleSubmit}
                  onBack={handleBack}
                  appointmentData={appointmentData}
                  patientData={patientData}
                />
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Agenda Fácil</h3>
                    <p className="text-sm text-gray-600">Selecciona fecha y hora según tu disponibilidad</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Múltiples Especialidades</h3>
                    <p className="text-sm text-gray-600">Contamos con especialistas en diversas áreas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <UserCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Confirmación Inmediata</h3>
                    <p className="text-sm text-gray-600">Recibe confirmación de tu cita al instante</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
