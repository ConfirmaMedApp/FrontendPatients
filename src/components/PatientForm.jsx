import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Calendar, Stethoscope, User, Phone, Mail, Check, ArrowRight, Eye } from 'lucide-react';
import { validatePatientByDocument, createPatient } from '@/lib/api';

export default function PatientForm({ onSubmit, onBack, appointmentData }) {
  const [cedula, setCedula] = useState('');
  const [cedulaValidated, setCedulaValidated] = useState(false);
  const [patientExists, setPatientExists] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
  });
  const [errors, setErrors] = useState({});
  const [showPatientModal, setShowPatientModal] = useState(false);

  // Validar cédula con el API
  const handleValidateCedula = async () => {
    if (!cedula) {
      setErrors({ cedula: 'La cédula es requerida' });
      return;
    }

    if (cedula.length < 6) {
      setErrors({ cedula: 'La cédula debe tener al menos 6 dígitos' });
      return;
    }

    setIsValidating(true);
    setErrors({});

    try {
      const patient = await validatePatientByDocument(cedula);
      
      if (patient) {
        // Paciente existe
        setPatientExists(true);
        setPatientData(patient);
        setCedulaValidated(true);
        
        // Pre-llenar datos
        setFormData({
          nombre: patient.name || '',
          apellido: patient.lastname || '',
          telefono: patient.phone || '',
          email: patient.email || '',
          fechaNacimiento: patient.birthdate || '',
        });
      } else {
        // Paciente no existe
        setPatientExists(false);
        setPatientData(null);
        setCedulaValidated(true);
        // Limpiar formulario
        setFormData({
          nombre: '',
          apellido: '',
          telefono: '',
          email: '',
          fechaNacimiento: '',
        });
      }
    } catch (err) {
      console.error('Error validando cédula:', err);
      setErrors({ cedula: 'Error al validar la cédula. Intenta nuevamente.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!cedulaValidated) {
      newErrors.cedula = 'Debes validar la cédula primero';
    }

    if (!patientExists) {
      if (!formData.nombre.trim()) {
        newErrors.nombre = 'El nombre es requerido';
      }
      if (!formData.apellido.trim()) {
        newErrors.apellido = 'El apellido es requerido';
      }
      if (!formData.telefono.trim()) {
        newErrors.telefono = 'El teléfono es requerido';
      } else if (!/^\d{10}$/.test(formData.telefono)) {
        newErrors.telefono = 'El teléfono debe tener 10 dígitos';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.fechaNacimiento) {
        newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Si el paciente no existe, crear uno nuevo
    if (!patientExists) {
      setIsSubmitting(true);
      try {
        const newPatientData = {
          name: formData.nombre,
          lastname: formData.apellido,
          email: formData.email,
          phone: formData.telefono,
          birthdate: formData.fechaNacimiento,
          document: cedula,
          documentTypeId: 1, // Asumiendo 1 para cédula, ajustar según necesidad
          genderId: 1, // Valor por defecto, se puede agregar un campo en el formulario
        };
        
        const createdPatient = await createPatient(newPatientData);
        setPatientData(createdPatient);
        onSubmit({ 
          cedula, 
          ...formData, 
          patientId: createdPatient?.id,
          id: createdPatient?.id // Asegurar que el id también esté disponible
        });
      } catch (err) {
        console.error('Error creando paciente:', err);
        setErrors({ submit: 'Error al crear el paciente. Intenta nuevamente.' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      onSubmit({ 
        cedula, 
        ...formData, 
        patientId: patientData?.id,
        id: patientData?.id // Asegurar que el id también esté disponible
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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

  return (
    <div className="space-y-6">


      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cédula */}
        <div className="space-y-2">
          <Label htmlFor="cedula" className="text-base">
            Número de Cédula *
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="cedula"
                type="text"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value.replace(/\D/g, ''));
                  setCedulaValidated(false);
                  setPatientExists(false);
                  if (errors.cedula) {
                    setErrors((prev) => ({ ...prev, cedula: '' }));
                  }
                }}
                placeholder="Ingresa tu número de cédula"
                disabled={cedulaValidated}
                className={errors.cedula ? 'border-red-500' : ''}
              />
            </div>
            <Button
              type="button"
              onClick={handleValidateCedula}
              disabled={cedulaValidated || isValidating}
              variant={cedulaValidated ? 'outline' : 'default'}
            >
              {isValidating ? (
                'Validando...'
              ) : cedulaValidated ? (
                <>
                  <Check className="h-4 w-4" />
                  Validado
                </>
              ) : (
                'Validar'
              )}
            </Button>
            <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setCedulaValidated(false);
                  setPatientExists(false);
                  setPatientData(null);
                  setFormData({
                    nombre: '',
                    apellido: '',
                    telefono: '',
                    email: '',
                    fechaNacimiento: '',
                  });
                }}
              >
                X
              </Button>
          </div>
          {errors.cedula && (
            <p className="text-sm text-red-500">{errors.cedula}</p>
          )}
          {cedulaValidated && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <p className="text-sm text-green-600 flex items-center gap-1 w-full">
                <Check className="h-4 w-4" />
                {patientExists 
                  ? 'Paciente registrado' 
                  : 'Paciente nuevo - Por favor completa tus datos'}
              </p>
              {patientExists && (
                <Dialog open={showPatientModal} onOpenChange={setShowPatientModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4" />
                      Ver datos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Información del Paciente</DialogTitle>
                      <DialogDescription>
                        Datos registrados en el sistema
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Cédula</Label>
                        <p className="text-base font-semibold">{cedula}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Nombre</Label>
                        <p className="text-base font-semibold">{formData.nombre}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Apellido</Label>
                        <p className="text-base font-semibold">{formData.apellido}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                        <p className="text-base font-semibold">{formData.telefono}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="text-base font-semibold">{formData.email}</p>
                      </div>
                      {formData.fechaNacimiento && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Fecha de Nacimiento</Label>
                          <p className="text-base font-semibold">
                            {new Date(formData.fechaNacimiento).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Formulario de datos (solo si se validó la cédula y NO existe) */}
        {cedulaValidated && !patientExists && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del Paciente
            </h3>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-base">
                Nombre *
              </Label>
              <Input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej: Juan"
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre}</p>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="apellido" className="text-base">
                Apellido *
              </Label>
              <Input
                id="apellido"
                type="text"
                value={formData.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                placeholder="Ej: Pérez García"
                className={errors.apellido ? 'border-red-500' : ''}
              />
              {errors.apellido && (
                <p className="text-sm text-red-500">{errors.apellido}</p>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento" className="text-base">
                Fecha de Nacimiento *
              </Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                className={errors.fechaNacimiento ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.fechaNacimiento && (
                <p className="text-sm text-red-500">{errors.fechaNacimiento}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-base">
                Teléfono *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value.replace(/\D/g, ''))}
                  placeholder="3001234567"
                  className={`pl-10 ${errors.telefono ? 'border-red-500' : ''}`}
                  maxLength={10}
                />
              </div>
              {errors.telefono && (
                <p className="text-sm text-red-500">{errors.telefono}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>
        )}

        {/* Error de submit */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            size="lg"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5" />
            Atrás
          </Button>
          <Button
            type="submit"
            className="flex-1"
            size="lg"
            disabled={!cedulaValidated || isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Siguiente'}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
