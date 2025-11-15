import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { LogOut, Plus, Edit, Trash2, ArrowRight, Download, Package, Pill, History, Minus } from 'lucide-react';

interface StorageItem {
  id: number;
  nombre: string;
  cantidad: number;
  categoria?: string;
  fecha_entrada: string;
}

interface Medicamento {
  id: number;
  nombre: string;
  cantidad: number;
  lote: string;
  fecha_expiracion: string;
  fecha_entrada: string;
}

interface Transferencia {
  id: number;
  nombre_producto: string;
  cantidad: number;
  categoria?: string;
  fecha_transferencia: string;
}

interface RetiroMedicamento {
  id: number;
  medicamento_id: number;
  nombre_medicamento: string;
  lote: string;
  cantidad_retirada: number;
  nota: string | null;
  fecha_retiro: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Estados para Storage Principal
  const [principal, setPrincipal] = useState<StorageItem[]>([]);
  const [principalForm, setPrincipalForm] = useState({ nombre: '', cantidad: '', categoria: '' });
  const [editingPrincipal, setEditingPrincipal] = useState<StorageItem | null>(null);
  
  // Estados para Storage Secundario
  const [secundario, setSecundario] = useState<StorageItem[]>([]);
  const [editingSecundario, setEditingSecundario] = useState<StorageItem | null>(null);
  
  // Estados para Medicamentos
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medicamentoForm, setMedicamentoForm] = useState({ nombre: '', cantidad: '', lote: '', fecha_expiracion: '' });
  const [editingMedicamento, setEditingMedicamento] = useState<Medicamento | null>(null);
  
  // Estados para Retiros de Medicamentos
  const [retiros, setRetiros] = useState<RetiroMedicamento[]>([]);
  const [retiroDialog, setRetiroDialog] = useState<{ 
    open: boolean; 
    medicamento: Medicamento | null;
    cantidad: string; 
    nota: string;
  }>({
    open: false,
    medicamento: null,
    cantidad: '',
    nota: ''
  });
  
  // Estados para Transferencias
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; item: StorageItem | null; cantidad: string }>({
    open: false,
    item: null,
    cantidad: ''
  });

  useEffect(() => {
  // Esperar hasta que AuthContext cargue el user y token
  if (user) {
    loadData();
  }
}, [user]);

  async function loadData() {
    try {
      const [principalData, secundarioData, medicamentosData, transferenciasData, retirosData] = await Promise.all([
        api.getStoragePrincipal(),
        api.getStorageSecundario(),
        api.getMedicamentos(),
        api.getTransferencias(),
        api.getRetirosMedicamentos()
      ]);
      setPrincipal(principalData);
      setSecundario(secundarioData);
      setMedicamentos(medicamentosData);
      setTransferencias(transferenciasData);
      setRetiros(retirosData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  // ==================== STORAGE PRINCIPAL ====================
  
  async function handleAddPrincipal(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.addStoragePrincipal({
        nombre: principalForm.nombre,
        cantidad: parseInt(principalForm.cantidad),
        categoria: principalForm.categoria || undefined
      });
      toast({ title: 'Éxito', description: 'Producto agregado/actualizado correctamente' });
      setPrincipalForm({ nombre: '', cantidad: '', categoria: '' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function handleUpdatePrincipal(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPrincipal) return;
    try {
      await api.updateStoragePrincipal(editingPrincipal.id, {
        nombre: editingPrincipal.nombre,
        cantidad: editingPrincipal.cantidad,
        categoria: editingPrincipal.categoria
      });
      toast({ title: 'Éxito', description: 'Producto actualizado correctamente' });
      setEditingPrincipal(null);
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function handleDeletePrincipal(id: number) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.deleteStoragePrincipal(id);
      toast({ title: 'Éxito', description: 'Producto eliminado correctamente' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function handleTransfer() {
    if (!transferDialog.item) return;
    try {
      await api.transferToSecundario(transferDialog.item.id, parseInt(transferDialog.cantidad));
      toast({ title: 'Éxito', description: 'Transferencia realizada correctamente' });
      setTransferDialog({ open: false, item: null, cantidad: '' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  // ==================== STORAGE SECUNDARIO ====================
  
  async function handleUpdateSecundario(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSecundario) return;
    try {
      await api.updateStorageSecundario(editingSecundario.id, {
        nombre: editingSecundario.nombre,
        cantidad: editingSecundario.cantidad,
        categoria: editingSecundario.categoria
      });
      toast({ title: 'Éxito', description: 'Producto actualizado correctamente' });
      setEditingSecundario(null);
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function handleDeleteSecundario(id: number) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.deleteStorageSecundario(id);
      toast({ title: 'Éxito', description: 'Producto eliminado correctamente' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  // ==================== MEDICAMENTOS ====================
  
  async function handleAddMedicamento(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.addMedicamento({
        nombre: medicamentoForm.nombre,
        cantidad: parseInt(medicamentoForm.cantidad),
        lote: medicamentoForm.lote,
        fecha_expiracion: medicamentoForm.fecha_expiracion
      });
      toast({ title: 'Éxito', description: 'Medicamento agregado correctamente' });
      setMedicamentoForm({ nombre: '', cantidad: '', lote: '', fecha_expiracion: '' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function handleUpdateMedicamento(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMedicamento) return;
    try {
      await api.updateMedicamento(editingMedicamento.id, {
        nombre: editingMedicamento.nombre,
        cantidad: editingMedicamento.cantidad,
        lote: editingMedicamento.lote,
        fecha_expiracion: editingMedicamento.fecha_expiracion
      });
      toast({ title: 'Éxito', description: 'Medicamento actualizado correctamente' });
      setEditingMedicamento(null);
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function handleDeleteMedicamento(id: number) {
    if (!confirm('¿Estás seguro de eliminar este medicamento?')) return;
    try {
      await api.deleteMedicamento(id);
      toast({ title: 'Éxito', description: 'Medicamento eliminado correctamente' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  // ==================== RETIROS DE MEDICAMENTOS ====================
  
  async function handleRetiroMedicamento() {
    if (!retiroDialog.medicamento) return;
    try {
      await api.registrarRetiroMedicamento({
        medicamento_id: retiroDialog.medicamento.id,
        cantidad_retirada: parseInt(retiroDialog.cantidad),
        nota: retiroDialog.nota || undefined
      });
      toast({ title: 'Éxito', description: 'Retiro registrado correctamente' });
      setRetiroDialog({ open: false, medicamento: null, cantidad: '', nota: '' });
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Inventario</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Bienvenido, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="principal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="principal">
              <Package className="h-4 w-4 mr-2" />
              Storage Principal
            </TabsTrigger>
            <TabsTrigger value="secundario">
              <Package className="h-4 w-4 mr-2" />
              Storage Secundario
            </TabsTrigger>
            <TabsTrigger value="medicamentos">
              <Pill className="h-4 w-4 mr-2" />
              Medicamentos
            </TabsTrigger>
            <TabsTrigger value="transferencias">
              <History className="h-4 w-4 mr-2" />
              Transferencias
            </TabsTrigger>
          </TabsList>

          {/* STORAGE PRINCIPAL */}
          <TabsContent value="principal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Producto</CardTitle>
                <CardDescription>Si el nombre ya existe, se actualizará la cantidad</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPrincipal} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={principalForm.nombre}
                      onChange={(e) => setPrincipalForm({ ...principalForm, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={principalForm.cantidad}
                      onChange={(e) => setPrincipalForm({ ...principalForm, cantidad: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input
                      value={principalForm.categoria}
                      onChange={(e) => setPrincipalForm({ ...principalForm, categoria: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inventario Principal</CardTitle>
                  <CardDescription>{principal.length} productos en stock</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => api.exportPrincipal()}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha de Entrada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {principal.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.categoria || '-'}</TableCell>
                        <TableCell>{new Date(item.fecha_entrada).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPrincipal(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTransferDialog({ open: true, item, cantidad: '' })}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrincipal(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STORAGE SECUNDARIO */}
          <TabsContent value="secundario" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inventario Secundario</CardTitle>
                  <CardDescription>{secundario.length} productos en stock</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => api.exportSecundario()}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha de Entrada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {secundario.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.categoria || '-'}</TableCell>
                        <TableCell>{new Date(item.fecha_entrada).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSecundario(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSecundario(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MEDICAMENTOS */}
          <TabsContent value="medicamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Medicamento</CardTitle>
                <CardDescription>Cada lote crea un registro único</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMedicamento} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={medicamentoForm.nombre}
                      onChange={(e) => setMedicamentoForm({ ...medicamentoForm, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={medicamentoForm.cantidad}
                      onChange={(e) => setMedicamentoForm({ ...medicamentoForm, cantidad: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Lote</Label>
                    <Input
                      value={medicamentoForm.lote}
                      onChange={(e) => setMedicamentoForm({ ...medicamentoForm, lote: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Fecha de Expiración</Label>
                    <Input
                      type="date"
                      value={medicamentoForm.fecha_expiracion}
                      onChange={(e) => setMedicamentoForm({ ...medicamentoForm, fecha_expiracion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventario de Medicamentos</CardTitle>
                <CardDescription>{medicamentos.length} medicamentos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Fecha Expiración</TableHead>
                      <TableHead>Fecha Entrada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicamentos.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium">{med.nombre}</TableCell>
                        <TableCell>{med.cantidad}</TableCell>
                        <TableCell>{med.lote}</TableCell>
                        <TableCell>{new Date(med.fecha_expiracion).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(med.fecha_entrada).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMedicamento(med)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRetiroDialog({ open: true, medicamento: med, cantidad: '', nota: '' })}
                            title="Retirar medicamento"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMedicamento(med.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRANSFERENCIAS */}
          <TabsContent value="transferencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Transferencias de Productos</CardTitle>
                <CardDescription>{transferencias.length} transferencias registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Origen → Destino</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferencias.map((trans) => (
                      <TableRow key={trans.id}>
                        <TableCell className="font-medium">{trans.nombre_producto}</TableCell>
                        <TableCell>{trans.cantidad}</TableCell>
                        <TableCell>{trans.categoria || '-'}</TableCell>
                        <TableCell>{new Date(trans.fecha_transferencia).toLocaleString()}</TableCell>
                        <TableCell>Principal → Secundario</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Retiros de Medicamentos</CardTitle>
                <CardDescription>{retiros.length} retiros registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Cantidad Retirada</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Fecha de Retiro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retiros.map((retiro) => (
                      <TableRow key={retiro.id}>
                        <TableCell className="font-medium">{retiro.nombre_medicamento}</TableCell>
                        <TableCell>{retiro.lote}</TableCell>
                        <TableCell>{retiro.cantidad_retirada}</TableCell>
                        <TableCell className="max-w-xs truncate">{retiro.nota || '-'}</TableCell>
                        <TableCell>{new Date(retiro.fecha_retiro).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Edición Principal */}
      <Dialog open={!!editingPrincipal} onOpenChange={() => setEditingPrincipal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {editingPrincipal && (
            <form onSubmit={handleUpdatePrincipal} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editingPrincipal.nombre}
                  onChange={(e) => setEditingPrincipal({ ...editingPrincipal, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingPrincipal.cantidad}
                  onChange={(e) => setEditingPrincipal({ ...editingPrincipal, cantidad: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Input
                  value={editingPrincipal.categoria || ''}
                  onChange={(e) => setEditingPrincipal({ ...editingPrincipal, categoria: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingPrincipal(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edición Secundario */}
      <Dialog open={!!editingSecundario} onOpenChange={() => setEditingSecundario(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {editingSecundario && (
            <form onSubmit={handleUpdateSecundario} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editingSecundario.nombre}
                  onChange={(e) => setEditingSecundario({ ...editingSecundario, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingSecundario.cantidad}
                  onChange={(e) => setEditingSecundario({ ...editingSecundario, cantidad: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Input
                  value={editingSecundario.categoria || ''}
                  onChange={(e) => setEditingSecundario({ ...editingSecundario, categoria: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingSecundario(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edición Medicamento */}
      <Dialog open={!!editingMedicamento} onOpenChange={() => setEditingMedicamento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Medicamento</DialogTitle>
          </DialogHeader>
          {editingMedicamento && (
            <form onSubmit={handleUpdateMedicamento} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editingMedicamento.nombre}
                  onChange={(e) => setEditingMedicamento({ ...editingMedicamento, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingMedicamento.cantidad}
                  onChange={(e) => setEditingMedicamento({ ...editingMedicamento, cantidad: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Lote</Label>
                <Input
                  value={editingMedicamento.lote}
                  onChange={(e) => setEditingMedicamento({ ...editingMedicamento, lote: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Fecha de Expiración</Label>
                <Input
                  type="date"
                  value={editingMedicamento.fecha_expiracion}
                  onChange={(e) => setEditingMedicamento({ ...editingMedicamento, fecha_expiracion: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingMedicamento(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Transferencia */}
      <Dialog open={transferDialog.open} onOpenChange={(open) => setTransferDialog({ ...transferDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir a Storage Secundario</DialogTitle>
            <DialogDescription>
              {transferDialog.item && `Producto: ${transferDialog.item.nombre} (Disponible: ${transferDialog.item.cantidad})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cantidad a transferir</Label>
              <Input
                type="number"
                min="1"
                max={transferDialog.item?.cantidad || 0}
                value={transferDialog.cantidad}
                onChange={(e) => setTransferDialog({ ...transferDialog, cantidad: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialog({ open: false, item: null, cantidad: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleTransfer}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Retiro de Medicamento */}
      <Dialog open={retiroDialog.open} onOpenChange={(open) => setRetiroDialog({ ...retiroDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirar Medicamento</DialogTitle>
            <DialogDescription>
              {retiroDialog.medicamento && `${retiroDialog.medicamento.nombre} - Lote: ${retiroDialog.medicamento.lote} (Disponible: ${retiroDialog.medicamento.cantidad})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cantidad a retirar</Label>
              <Input
                type="number"
                min="1"
                max={retiroDialog.medicamento?.cantidad || 0}
                value={retiroDialog.cantidad}
                onChange={(e) => setRetiroDialog({ ...retiroDialog, cantidad: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Nota (opcional)</Label>
              <Textarea
                value={retiroDialog.nota}
                onChange={(e) => setRetiroDialog({ ...retiroDialog, nota: e.target.value })}
                placeholder="Motivo del retiro, paciente, etc..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetiroDialog({ open: false, medicamento: null, cantidad: '', nota: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleRetiroMedicamento}>Retirar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}