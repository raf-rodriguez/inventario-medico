const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response;
  }

  // Autenticación
  async login(username: string, password: string) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async register(username: string, password: string) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    const response = await this.request('/api/auth/me');
    return response.json();
  }

  // Storage Principal
  async getStoragePrincipal() {
    const response = await this.request('/api/storage-principal');
    return response.json();
  }

  async addStoragePrincipal(data: { nombre: string; cantidad: number; categoria?: string }) {
    const response = await this.request('/api/storage-principal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateStoragePrincipal(id: number, data: { nombre: string; cantidad: number; categoria?: string }) {
    const response = await this.request(`/api/storage-principal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteStoragePrincipal(id: number) {
    const response = await this.request(`/api/storage-principal/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async transferToSecundario(id: number, cantidad: number) {
    const response = await this.request('/api/storage-principal/transfer', {
      method: 'POST',
      body: JSON.stringify({ id, cantidad }),
    });
    return response.json();
  }

  // Storage Secundario
  async getStorageSecundario() {
    const response = await this.request('/api/storage-secundario');
    return response.json();
  }

  async updateStorageSecundario(id: number, data: { nombre: string; cantidad: number; categoria?: string }) {
    const response = await this.request(`/api/storage-secundario/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteStorageSecundario(id: number) {
    const response = await this.request(`/api/storage-secundario/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Medicamentos
  async getMedicamentos() {
    const response = await this.request('/api/medicamentos');
    return response.json();
  }

  async addMedicamento(data: { nombre: string; cantidad: number; lote: string; fecha_expiracion: string }) {
    const response = await this.request('/api/medicamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateMedicamento(id: number, data: { nombre: string; cantidad: number; lote: string; fecha_expiracion: string }) {
    const response = await this.request(`/api/medicamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteMedicamento(id: number) {
    const response = await this.request(`/api/medicamentos/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Transferencias
  async getTransferencias() {
    const response = await this.request('/api/transferencias');
    return response.json();
  }

    // Retiros de Medicamentos
async getRetirosMedicamentos() {
  const response = await this.request('/api/retiros_medicamentos');
  return response.json();
}

async registrarRetiroMedicamento(data: { medicamento_id: number; cantidad_retirada: number; nota?: string }) {
  const response = await this.request('/api/retiros_medicamentos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}


  // Exportación
  async exportPrincipal() {
    const response = await this.request('/api/export/principal');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storage_principal.csv';
    a.click();
  }

  
  async exportSecundario() {
    const response = await this.request('/api/export/secundario');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storage_secundario.csv';
    a.click();
  }
}

export const api = new ApiClient();