'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import { employees as initialEmployees, Employee } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
    return amount.toLocaleString() + '₮';
}

const statusLabels: Record<string, string> = {
    active: 'Ажиллаж буй',
    off: 'Амарч буй',
    vacation: 'Амралт',
};
const statusColors: Record<string, string> = {
    active: 'bg-success/15 text-success',
    off: 'bg-muted text-muted-foreground',
    vacation: 'bg-info/15 text-info',
};
const shiftLabels: Record<string, string> = {
    morning: '☀️ Өглөө',
    evening: '🌅 Орой',
    night: '🌙 Шөнө',
};

const roles: Employee['role'][] = ['Менежер', 'Тогооч', 'Зөөгч', 'Кассчин', 'Угаагч'];
const shifts: Employee['shift'][] = ['morning', 'evening', 'night'];

export default function Employees() {
    const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const filtered = employeeList.filter(e => {
        const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.includes(search);
        const matchRole = filterRole === 'all' || e.role === filterRole;
        return matchSearch && matchRole;
    });

    const activeCount = employeeList.filter(e => e.status === 'active').length;

    function handleSave(emp: Partial<Employee>) {
        if (editingEmployee) {
            setEmployeeList(prev => prev.map(e => e.id === editingEmployee.id ? { ...e, ...emp } as Employee : e));
            toast.success('Ажилтны мэдээлэл шинэчлэгдлээ');
            setEditingEmployee(null);
        } else {
            const newEmp: Employee = {
                id: `E${String(employeeList.length + 1).padStart(3, '0')}`,
                name: emp.name || '',
                role: emp.role || 'Зөөгч',
                phone: emp.phone || '',
                email: emp.email || '',
                status: 'active',
                shift: emp.shift || 'morning',
                salary: emp.salary || 1200000,
                startDate: new Date().toISOString().split('T')[0],
                avatar: emp.role === 'Тогооч' ? '👨‍🍳' : emp.role === 'Менежер' ? '👨‍💼' : '🧑‍🍳',
            };
            setEmployeeList(prev => [...prev, newEmp]);
            toast.success('Шинэ ажилтан нэмэгдлээ');
        }
        setIsAddOpen(false);
    }

    function handleDelete(id: string) {
        setEmployeeList(prev => prev.filter(e => e.id !== id));
        toast.success('Ажилтан устгагдлаа');
    }

    return (
        <div className="p-8 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                            <Users className="w-7 h-7 text-primary" />
                            Ажилтны удирдлага
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Нийт {employeeList.length} ажилтан · {activeCount} идэвхтэй
                        </p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <Plus className="w-4 h-4 mr-2" /> Ажилтан нэмэх
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="font-display text-foreground">
                                    {editingEmployee ? 'Ажилтан засах' : 'Шинэ ажилтан'}
                                </DialogTitle>
                            </DialogHeader>
                            <EmployeeForm
                                employee={editingEmployee}
                                onSave={handleSave}
                                onCancel={() => { setIsAddOpen(false); setEditingEmployee(null); }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* Toolbar */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Нэр, албан тушаалаар хайх..." className="pl-9 bg-card border-border" />
                </div>
                <div className="flex gap-2">
                    {['all', ...roles].map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filterRole === role ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'
                                }`}
                        >
                            {role === 'all' ? 'Бүгд' : role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                    {filtered.map((emp, i) => (
                        <motion.div
                            key={emp.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -3 }}
                            className="glass-card rounded-xl p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{emp.avatar}</span>
                                    <div>
                                        <h3 className="font-display font-semibold text-foreground">{emp.name}</h3>
                                        <p className="text-sm text-primary font-medium">{emp.role}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[emp.status]}`}>
                                    {statusLabels[emp.status]}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5" /> {emp.phone}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5" /> {emp.email}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground">{shiftLabels[emp.shift]}</span>
                                    <span className="font-mono text-sm font-semibold text-foreground">{formatCurrency(emp.salary)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setEditingEmployee(emp); setIsAddOpen(true); }}
                                    className="flex-1 text-xs"
                                >
                                    <Edit2 className="w-3 h-3 mr-1" /> Засах
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(emp.id)}
                                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function EmployeeForm({ employee, onSave, onCancel }: {
    employee: Employee | null;
    onSave: (emp: Partial<Employee>) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(employee?.name || '');
    const [role, setRole] = useState<Employee['role']>(employee?.role || 'Зөөгч');
    const [phone, setPhone] = useState(employee?.phone || '');
    const [email, setEmail] = useState(employee?.email || '');
    const [shift, setShift] = useState<Employee['shift']>(employee?.shift || 'morning');
    const [salary, setSalary] = useState(String(employee?.salary || 1200000));

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Нэр</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border" />
            </div>
            <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Албан тушаал</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Employee['role'])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Утас</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Имэйл</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background border-border" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Ээлж</label>
                    <select value={shift} onChange={(e) => setShift(e.target.value as Employee['shift'])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                        {shifts.map(s => <option key={s} value={s}>{shiftLabels[s]}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Цалин</label>
                    <Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="bg-background border-border" />
                </div>
            </div>
            <div className="flex gap-3 pt-2">
                <Button onClick={() => onSave({ name, role, phone, email, shift, salary: Number(salary) })} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    Хадгалах
                </Button>
                <Button variant="outline" onClick={onCancel}>Цуцлах</Button>
            </div>
        </div>
    );
}
