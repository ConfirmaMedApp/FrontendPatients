const BASE_URL = 'https://backend-production-7230.up.railway.app/api';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json().catch(() => null);
}

export async function getAvailableSlots(specialityId, dateSelected, startHour = null) {
  if (!specialityId || !dateSelected) return { slots: [], usedRecommendations: false };
  // dateSelected expected as YYYY-MM-DD
  // startHour optional as HH:MM
  const encodedSpeciality = encodeURIComponent(specialityId);
  const encodedDate = encodeURIComponent(dateSelected);
  
  let url;
  let usingStartHour = false;
  if (startHour) {
    const encodedHour = encodeURIComponent(startHour);
    url = `${BASE_URL}/Appointments/patient/need/specialities/${encodedSpeciality}/date/${encodedDate}/hour/${encodedHour}`;
    usingStartHour = true;
  } else {
    url = `${BASE_URL}/Appointments/patient/recommendations/specialities/${encodedSpeciality}/date/${encodedDate}`;
  }

  try {
    const data = await fetchJson(url);

    // Flexible parsing depending on API shape
    let items = [];
    if (!data) return { slots: [], usedRecommendations: false };

    if (Array.isArray(data)) {
      items = data;
    } else if (data.items) {
      // If items is an object (single result), convert to array
      if (typeof data.items === 'object' && !Array.isArray(data.items)) {
        items = [data.items];
      } else if (Array.isArray(data.items)) {
        items = data.items;
      }
    } else if (Array.isArray(data.slots)) {
      items = data.slots;
    } else if (Array.isArray(data.timeSlots)) {
      items = data.timeSlots;
    } else if (Array.isArray(data.available)) {
      items = data.available;
    }

    // Normalize to { time: string, available: boolean, id: number, doctor: object }
    const normalized = items.map((item) => {
      if (typeof item === 'string') return { time: item, available: true };
      if (item == null) return null;
      
      // Extract time from startHour
      let time = item.startHour;
      
      // Remove seconds from time format (10:00:00 -> 10:00)
      if (time && typeof time === 'string' && time.includes(':')) {
        const parts = time.split(':');
        if (parts.length === 3) {
          time = `${parts[0]}:${parts[1]}`;
        }
      }
      
      // isOccuped: false means available
      const available = Object.prototype.hasOwnProperty.call(item, 'isOccuped') 
        ? !item.isOccuped 
        : (Object.prototype.hasOwnProperty.call(item, 'available') ? !!item.available : true);
      
      if (time) {
        return { 
          time, 
          available,
          id: item.id,
          doctor: item.doctor
        };
      }
      return null;
    }).filter(Boolean);

    // Remove duplicates based on time
    const seen = new Set();
    const unique = normalized.filter((item) => {
      if (seen.has(item.time)) {
        return false;
      }
      seen.add(item.time);
      return true;
    });

    return { slots: unique, usedRecommendations: false };
  } catch (err) {
    // If we got a 404 or error when searching by hour, try recommendations
    if (usingStartHour && (err.status === 404 || err.message.includes('404'))) {
      console.log('No se encontró cita para la hora específica, buscando recomendaciones...');
      // Call without hour to get recommendations
      const result = await getAvailableSlots(specialityId, dateSelected, null);
      return { slots: result.slots, usedRecommendations: true };
    }
    throw err;
  }
}

export default {
  getAvailableSlots,
};

export async function validatePatientByDocument(document) {
  const url = `${BASE_URL}/Patients/by-document?document=${encodeURIComponent(document)}`;
  try {
    const data = await fetchJson(url);
    // Extract patient data from items property
    if (data && data.items) {
      return data.items;
    }
    return data; // Fallback if structure is different
  } catch (err) {
    // If 404, patient doesn't exist
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createPatient(patientData) {
  const url = `${BASE_URL}/Patients`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => null);
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    
    return res.json().catch(() => null);
  } catch (err) {
    throw err;
  }
}

export async function getSpecialities() {
  const url = `${BASE_URL}/Specialities?status=true`;
  try {
    const data = await fetchJson(url);
    if (!data) return [];

    // Normalize to array of { value, label }
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data.items)) items = data.items;
    else if (Array.isArray(data.results)) items = data.results;

    const normalized = items.map((item) => {
      if (typeof item === 'string') return { value: item, label: item };
      const value = item.id || item.slug || item.value || item.code;
      const label = item.name || item.label || item.displayName || item.description || value;
      return { value: String(value), label };
    }).filter(Boolean);

    return normalized;
  } catch (err) {
    throw err;
  }
}

export async function assignAppointment(appointmentId, patientId) {
  const url = `${BASE_URL}/Appointments/assign`;
  
  // Validar que ambos parámetros estén presentes
  if (!appointmentId) {
    throw new Error('appointmentId es requerido');
  }
  if (!patientId) {
    throw new Error('patientId es requerido');
  }
  
  const payload = {
    appointmentId,
    patientId,
  };
  
  console.log('Asignando cita con:', payload);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => null);
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    
    const result = await res.json().catch(() => null);
    console.log('Cita asignada exitosamente:', result);
    return result;
  } catch (err) {
    console.error('Error en assignAppointment:', err);
    throw err;
  }
}
