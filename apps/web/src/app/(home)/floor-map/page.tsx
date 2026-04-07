'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map, Users as UsersIcon, Clock, Utensils, ZoomIn, ZoomOut, Maximize2, Plus, Trash2, Edit3 } from 'lucide-react';
import { floorTables, TableInfo } from '@/data/mockData';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors: Record<string, { bg: string; border: string; text: string; label: string; dot: string }> = {
    available: { bg: 'fill-success/20', border: 'stroke-success', text: 'text-success', label: 'Чөлөөтэй', dot: 'bg-success' },
    occupied: { bg: 'fill-primary/20', border: 'stroke-primary', text: 'text-primary', label: 'Захиалгатай', dot: 'bg-primary' },
    reserved: { bg: 'fill-warning/20', border: 'stroke-warning', text: 'text-warning', label: 'Захиалсан', dot: 'bg-warning' },
    cleaning: { bg: 'fill-muted', border: 'stroke-muted-foreground', text: 'text-muted-foreground', label: 'Цэвэрлэж буй', dot: 'bg-muted-foreground' },
};

export default function FloorMap() {
    const [tables, setTables] = useState<TableInfo[]>(floorTables);
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newTable, setNewTable] = useState({ seats: 4, shape: 'rect' as 'rect' | 'circle' });

    // Drag state
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
    const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(z + (e.deltaY > 0 ? -0.1 : 0.1), 0.5), 3));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.button === 1 || e.altKey) && !draggingId) {
            setIsPanning(true);
            panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        }
    }, [pan, draggingId]);

    const getSvgPoint = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const svgWidth = 720;
        const svgHeight = 520;
        const scale = rect.width / svgWidth;
        return {
            x: (clientX - rect.left) / scale / zoom - pan.x / zoom / scale,
            y: (clientY - rect.top) / scale / zoom - pan.y / zoom / scale,
        };
    }, [zoom, pan]);

    const handleTableDragStart = useCallback((e: React.MouseEvent, table: TableInfo) => {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        const pt = getSvgPoint(e.clientX, e.clientY);
        dragOffset.current = { x: pt.x - table.x, y: pt.y - table.y };
        setDraggingId(table.id);
    }, [editMode, getSvgPoint]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: panStart.current.panX + (e.clientX - panStart.current.x),
                y: panStart.current.panY + (e.clientY - panStart.current.y),
            });
            return;
        }
        if (draggingId !== null) {
            const pt = getSvgPoint(e.clientX, e.clientY);
            const newX = Math.max(0, Math.min(620, pt.x - dragOffset.current.x));
            const newY = Math.max(0, Math.min(450, pt.y - dragOffset.current.y));
            setTables(prev => prev.map(t =>
                t.id === draggingId ? { ...t, x: Math.round(newX / 10) * 10, y: Math.round(newY / 10) * 10 } : t
            ));
        }
    }, [isPanning, draggingId, getSvgPoint]);

    const handleMouseUp = useCallback(() => {
        if (draggingId !== null) {
            toast.success(`Ширээ №${draggingId} шинэ байршилд зөөгдлөө`);
        }
        setIsPanning(false);
        setDraggingId(null);
    }, [draggingId]);

    function cycleStatus(table: TableInfo) {
        const flow: Record<string, TableInfo['status']> = {
            available: 'occupied', occupied: 'cleaning', cleaning: 'available', reserved: 'occupied',
        };
        const newStatus = flow[table.status];
        setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: newStatus } : t));
        setSelectedTable(prev => prev?.id === table.id ? { ...prev, status: newStatus } : prev);
        toast.success(`Ширээ №${table.id}: ${statusColors[newStatus].label}`);
    }

    function addTable() {
        const maxId = tables.reduce((max, t) => Math.max(max, t.id), 0);
        const newT: TableInfo = {
            id: maxId + 1,
            seats: newTable.seats,
            status: 'available',
            x: 300,
            y: 250,
            width: newTable.shape === 'circle' ? 70 : (newTable.seats > 4 ? 120 : 90),
            height: newTable.shape === 'circle' ? 70 : 90,
            shape: newTable.shape,
        };
        setTables(prev => [...prev, newT]);
        setAddDialogOpen(false);
        toast.success(`Ширээ №${newT.id} нэмэгдлээ — чирж байршлыг тохируулна уу`);
    }

    function removeTable(id: number) {
        setTables(prev => prev.filter(t => t.id !== id));
        if (selectedTable?.id === id) setSelectedTable(null);
        toast.success(`Ширээ №${id} устгагдлаа`);
    }

    return (
        <div className="p-8 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                            <Map className="w-7 h-7 text-primary" />
                            Ширээний газрын зураг
                        </h1>
                        <p className="text-muted-foreground mt-1">Ширээний байршил, төлөвийг удирдах</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={editMode ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEditMode(!editMode)}
                            className={editMode ? 'bg-primary text-primary-foreground' : ''}
                        >
                            <Edit3 className="w-4 h-4 mr-1" />
                            {editMode ? 'Засварлаж байна' : 'Засварлах'}
                        </Button>
                        {editMode && (
                            <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" />
                                Ширээ нэмэх
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Stats Bar */}
            <div className="flex gap-4 flex-wrap">
                {Object.entries(statusColors).map(([key, val]) => {
                    const count = tables.filter(t => t.status === key).length;
                    return (
                        <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${val.dot}`} />
                            <span className="text-sm text-foreground font-medium">{val.label}</span>
                            <span className="text-sm font-mono font-bold text-foreground">{count}</span>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Floor Map SVG */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 glass-card rounded-xl p-6 relative overflow-hidden"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: draggingId ? 'grabbing' : isPanning ? 'grabbing' : editMode ? 'crosshair' : 'default' }}
                >
                    {/* Zoom Controls */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
                        <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="absolute top-4 left-4 z-10 text-xs font-mono text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded">
                        {Math.round(zoom * 100)}%
                        {editMode && <span className="ml-2 text-primary">✏️ Засвар</span>}
                    </div>

                    <div style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: 'center center', transition: isPanning || draggingId ? 'none' : 'transform 0.2s ease' }}>
                        <svg ref={svgRef} viewBox="0 0 720 520" className="w-full h-auto select-none">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220 15% 90%)" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="720" height="520" fill="url(#grid)" rx="12" />

                            {/* Kitchen area */}
                            <rect x="620" y="10" width="90" height="500" rx="8" fill="hsl(25 95% 53% / 0.05)" stroke="hsl(25 95% 53% / 0.2)" strokeWidth="1" strokeDasharray="6 3" />
                            <text x="665" y="260" fill="hsl(25 95% 53% / 0.4)" fontSize="12" textAnchor="middle" transform="rotate(-90 665 260)" className="font-display">ГАЛ ТОГОО</text>

                            {/* Entrance */}
                            <rect x="10" y="480" width="80" height="30" rx="6" fill="hsl(160 60% 45% / 0.1)" stroke="hsl(160 60% 45% / 0.3)" strokeWidth="1" />
                            <text x="50" y="500" fill="hsl(160 60% 45% / 0.5)" fontSize="10" textAnchor="middle">ОРОХ</text>

                            {/* Tables */}
                            {tables.map((table, i) => {
                                const colors = statusColors[table.status];
                                const isSelected = selectedTable?.id === table.id;
                                const isDragging = draggingId === table.id;
                                return (
                                    <g
                                        key={table.id}
                                        onMouseDown={(e) => handleTableDragStart(e, table)}
                                        onClick={() => { if (!isDragging) setSelectedTable(table); }}
                                        onDoubleClick={() => { if (!editMode) cycleStatus(table); }}
                                        className={editMode ? 'cursor-grab' : 'cursor-pointer'}
                                        style={{ opacity: isDragging ? 0.7 : 1 }}
                                    >
                                        {table.shape === 'circle' ? (
                                            <circle
                                                cx={table.x + table.width / 2}
                                                cy={table.y + table.height / 2}
                                                r={table.width / 2}
                                                className={`${colors.bg} ${colors.border}`}
                                                strokeWidth={isSelected ? 3 : 2}
                                                strokeDasharray={editMode ? '4 2' : 'none'}
                                            />
                                        ) : (
                                            <rect
                                                x={table.x}
                                                y={table.y}
                                                width={table.width}
                                                height={table.height}
                                                rx={10}
                                                className={`${colors.bg} ${colors.border}`}
                                                strokeWidth={isSelected ? 3 : 2}
                                                strokeDasharray={editMode ? '4 2' : 'none'}
                                            />
                                        )}
                                        <text
                                            x={table.x + table.width / 2}
                                            y={table.y + table.height / 2 - 4}
                                            textAnchor="middle"
                                            className={`${colors.text} font-display`}
                                            fontSize="16"
                                            fontWeight="bold"
                                            fill="currentColor"
                                        >
                                            №{table.id}
                                        </text>
                                        <text
                                            x={table.x + table.width / 2}
                                            y={table.y + table.height / 2 + 14}
                                            textAnchor="middle"
                                            fill="hsl(220 10% 50%)"
                                            fontSize="10"
                                        >
                                            {table.guestCount ? `${table.guestCount}/${table.seats}` : `${table.seats} суудал`}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                        {editMode
                            ? 'Ширээг чирж зөөх • Дээрх товчоор нэмэх/устгах'
                            : 'Давхар товшиж төлөв солих • Scroll-ээр томруулах • Alt+чирэх-ээр зөөх'}
                    </p>
                </motion.div>

                {/* Table Detail Panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-foreground mb-4">Ширээний мэдээлэл</h2>
                    {selectedTable ? (
                        <motion.div key={selectedTable.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="text-center py-4">
                                <span className="text-5xl font-display font-bold text-foreground">№{selectedTable.id}</span>
                                <div className="mt-3">
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${selectedTable.status === 'available' ? 'bg-success/15 text-success' :
                                        selectedTable.status === 'occupied' ? 'bg-primary/15 text-primary' :
                                            selectedTable.status === 'reserved' ? 'bg-warning/15 text-warning' :
                                                'bg-muted text-muted-foreground'
                                        }`}>
                                        {statusColors[selectedTable.status].label}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-border/50">
                                    <span className="text-muted-foreground flex items-center gap-2"><Utensils className="w-4 h-4" /> Суудал</span>
                                    <span className="font-semibold text-foreground">{selectedTable.seats}</span>
                                </div>
                                {selectedTable.guestCount && (
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground flex items-center gap-2"><UsersIcon className="w-4 h-4" /> Зочид</span>
                                        <span className="font-semibold text-foreground">{selectedTable.guestCount}</span>
                                    </div>
                                )}
                                {selectedTable.orderId && (
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Захиалга</span>
                                        <span className="font-mono font-semibold text-primary">{selectedTable.orderId}</span>
                                    </div>
                                )}
                            </div>

                            {editMode && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full mt-4"
                                    onClick={() => removeTable(selectedTable.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Ширээ устгах
                                </Button>
                            )}
                        </motion.div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            Ширээ сонгоно уу
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Add Table Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Шинэ ширээ нэмэх</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Суудлын тоо</Label>
                            <Input
                                type="number"
                                min={1}
                                max={12}
                                value={newTable.seats}
                                onChange={e => setNewTable(p => ({ ...p, seats: parseInt(e.target.value) || 2 }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Хэлбэр</Label>
                            <Select value={newTable.shape} onValueChange={(v: 'rect' | 'circle') => setNewTable(p => ({ ...p, shape: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rect">Тэгш өнцөгт</SelectItem>
                                    <SelectItem value="circle">Дугуй</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Болих</Button>
                        <Button onClick={addTable}>Нэмэх</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
