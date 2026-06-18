import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  Package,
  Navigation,
  Users,
  Search,
  User,
  LogOut,
  Eye,
  EyeOff,
  PlusCircle,
  Save,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  DollarSign,
  Edit3,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { auth, db } from './firebase';
import { UsuarioVendedor, PedidoRuta } from './types';

// Operation Types for error handles
enum OperationType {
  GET = 'GET',
  LIST = 'LIST',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

const handleFirestoreError = (err: any, op: OperationType, path: string) => {
  console.error(`[Firestore Error] Operation: ${op} | Path: ${path} | Details:`, err);
};

export default function App() {
  // Navigation & User State
  const [activeVista, setActiveVista] = useState<'login' | 'registro' | 'menu' | 'captura' | 'programados' | 'enproceso' | 'clientes' | 'consulta' | 'perfil' | 'reporte'>('login');
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null);
  const [perfilDocId, setPerfilDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialSplash, setInitialSplash] = useState<boolean>(true);

  // Startup splash screen timer: minimum 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Profile data values (from USUARIOS collection)
  const [perfilPass, setPerfilPass] = useState('');
  const [perfilNombrePila, setPerfilNombrePila] = useState('');
  const [perfilTelefono, setPerfilTelefono] = useState('');
  const [perfilDireccion, setPerfilDireccion] = useState('');
  const [perfilRubro, setPerfilRubro] = useState('');
  const [perfilDatosCompletos, setPerfilDatosCompletos] = useState<UsuarioVendedor | null>(null);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register inputs
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regUserNombre, setRegUserNombre] = useState('');
  const [regNombrePila, setRegNombrePila] = useState('');
  const [regDireccion, setRegDireccion] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regRubro, setRegRubro] = useState('');

  // Captura Form inputs
  const [nombreRecibe, setNombreRecibe] = useState('');
  const [apellidoRecibe, setApellidoRecibe] = useState('');
  const [direccionInput, setDireccionInput] = useState('');
  const [zonaSelect, setZonaSelect] = useState('');
  const [telefonoInput, setTelefonoInput] = useState('');
  const [cobrarInput, setCobrarInput] = useState('');
  const [referenciaInput, setReferenciaInput] = useState('');
  const [contenidoInput, setContenidoInput] = useState('');

  // Form focus chain references
  const nombreRecibeRef = useRef<HTMLInputElement>(null);
  const apellidoRecibeRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const zonaRef = useRef<HTMLSelectElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const cobrarRef = useRef<HTMLInputElement>(null);
  const contenidoRef = useRef<HTMLInputElement>(null);
  const referenciaRef = useRef<HTMLInputElement>(null);

  const [frecuenteModal, setFrecuenteModal] = useState<{ show: boolean; cliente: any } | null>(null);
  const [frecuenteContenido, setFrecuenteContenido] = useState('');
  const [frecuenteCobrar, setFrecuenteCobrar] = useState('');
  const frecuenteCobrarRef = useRef<HTMLInputElement>(null);

  // Register Form focus chain references
  const regEmailRef = useRef<HTMLInputElement>(null);
  const regPasswordRef = useRef<HTMLInputElement>(null);
  const regUserNombreRef = useRef<HTMLInputElement>(null);
  const regNombrePilaRef = useRef<HTMLInputElement>(null);
  const regTelefonoRef = useRef<HTMLInputElement>(null);
  const regDireccionRef = useRef<HTMLInputElement>(null);
  const regRubroRef = useRef<HTMLInputElement>(null);
  const regBtnRef = useRef<HTMLButtonElement>(null);

  const isRegisteringRef = useRef<boolean>(false);

  // Collections Lists
  const [pedidosProgramados, setPedidosProgramados] = useState<any[]>([]);
  const [programadosColumns, setProgramadosColumns] = useState<string[]>([]);
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const [pedidosEnProceso, setPedidosEnProceso] = useState<PedidoRuta[]>([]);

  const [todosClientes, setTodosClientes] = useState<any[]>([]);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [sugerenciasClientes, setSugerenciasClientes] = useState<any[]>([]);

  // Consulta de Envíos State (Last 70 Days)
  const [consultaEnvios, setConsultaEnvios] = useState<PedidoRuta[]>([]);
  const [searchConsulta, setSearchConsulta] = useState('');
  const [filterStatusConsulta, setFilterStatusConsulta] = useState('');

  // Reporte General (REP_DIA collection)
  const [reporteDiaLog, setReporteDiaLog] = useState<any[]>([]);
  const [limiteDiasReporte, setLimiteDiasReporte] = useState<number | 'TODO'>(30);

  // Custom visual components state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [promptModal, setPromptModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    placeholder: string;
    onConfirm: (val: string) => void;
  } | null>(null);

  const [promptValue, setPromptValue] = useState('');

  // Toast notifier
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Convert Firebase formats & timestamps cleanly
  const formatToDDMMAAAA = (val: any): string => {
    if (!val) return '';
    let d: Date;
    if (typeof val.toDate === 'function') {
      try { d = val.toDate(); } catch(e) { return String(val); }
    } else if (val instanceof Date) {
      d = val;
    } else if (val.seconds !== undefined) {
      d = new Date(val.seconds * 1000);
    } else {
      const parsed = Date.parse(val);
      if (isNaN(parsed)) return String(val);
      d = new Date(parsed);
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const formatFullTimestamp = (val: any): string => {
    if (!val) return '';
    let d: Date;
    if (typeof val.toDate === 'function') {
      try { d = val.toDate(); } catch(e) { return String(val); }
    } else if (val instanceof Date) {
      d = val;
    } else if (val.seconds !== undefined) {
      d = new Date(val.seconds * 1000);
    } else {
      const parsed = Date.parse(val);
      if (isNaN(parsed)) return String(val);
      d = new Date(parsed);
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Safe checks if cargo dates are from today
  const isShipmentFromToday = (p: any): boolean => {
    const val = p["FECHA DE ENV"] || p["fecha_env"] || p["FECHA"] || p["fecha"] || p["Marca temporal"] || p["id"] || '';
    if (!val) return false;
    let d: Date;
    if (typeof val.toDate === 'function') {
      try { d = val.toDate(); } catch (e) { return false; }
    } else if (val instanceof Date) {
      d = val;
    } else if (val.seconds !== undefined) {
      d = new Date(val.seconds * 1000);
    } else {
      const s = String(val).trim();
      if (s.includes('/')) {
        const parts = s.split(' ')[0].split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          d = new Date(year, month, day);
        } else {
          const parsed = Date.parse(s);
          if (isNaN(parsed)) return false;
          d = new Date(parsed);
        }
      } else {
        const parsed = Date.parse(s);
        if (isNaN(parsed)) return false;
        d = new Date(parsed);
      }
    }
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  // Listening to Auth Status changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUsuarioEmail(firebaseUser.email);
        
        // If we are currently in registration process, let handleRegister populate the DB and setup state
        if (isRegisteringRef.current) {
          setLoading(false);
          return;
        }

        const emailToSearch = String(firebaseUser.email || '').toLowerCase().trim();
        
        try {
          // Query user seller configuration profile
          const qUser = query(
            collection(db, 'USUARIOS'),
            where('USER_CORREO', '==', emailToSearch)
          );
          const snapshotUser = await getDocs(qUser);
          
          if (!snapshotUser.empty) {
            const docSnap = snapshotUser.docs[0];
            const data = docSnap.data() as UsuarioVendedor;
            const businessName = data.USER_NOMBRE || '';
            
            setUsuarioActual(businessName);
            setPerfilDocId(docSnap.id);
            setPerfilDatosCompletos(data);
            
            // Set fields for local editing values
            setPerfilPass(data["CONTRASEÑA"] || '');
            setPerfilNombrePila(data["NOMBRE DE PILA"] || '');
            setPerfilTelefono(String(data.TELEFONO || ''));
            setPerfilDireccion(data.DIRECCION || '');
            setPerfilRubro(data.RUBRO || '');
            
            sessionStorage.setItem('usuarioActual', businessName);
            
            // Send user to menu view if logged in
            if (activeVista === 'login' || activeVista === 'registro') {
              setActiveVista('menu');
            }
          } else {
            showToast('Tu correo no está registrado en la colección de USUARIOS. Acceso no autorizado.', 'error');
            setUsuarioActual(null);
            setPerfilDocId(null);
            sessionStorage.removeItem('usuarioActual');
            await signOut(auth);
            setActiveVista('login');
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'USUARIOS');
          showToast('Error al conectar con la base de datos de vendedores.', 'error');
        }
      } else {
        setUsuarioActual(null);
        setUsuarioEmail(null);
        setPerfilDocId(null);
        setPerfilDatosCompletos(null);
        sessionStorage.removeItem('usuarioActual');
        if (activeVista !== 'registro') {
          setActiveVista('login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeVista]);

  // Handle data fetching depending on current active views
  useEffect(() => {
    if (!usuarioActual) return;

    if (activeVista === 'programados') {
      fetchPedidosProgramados();
    } else if (activeVista === 'enproceso') {
      fetchPedidosEnProceso();
    } else if (activeVista === 'clientes') {
      fetchClientesAgrupados();
    } else if (activeVista === 'consulta') {
      fetchConsultaEnvios70Dias();
    } else if (activeVista === 'menu') {
      // Reload stats
      reloadProfileStats();
    } else if (activeVista === 'reporte') {
      fetchReporteDia();
    }
  }, [activeVista, usuarioActual]);

  // Reload current counts from database
  const reloadProfileStats = async () => {
    if (!perfilDocId) return;
    try {
      const q = query(collection(db, 'USUARIOS'));
      const s = await getDocs(q);
      s.forEach((docSnap) => {
        if (docSnap.id === perfilDocId) {
          setPerfilDatosCompletos(docSnap.data() as UsuarioVendedor);
        }
      });
    } catch(e) {}
  };

  // Fetch Scheduled Pedidos (CAPTURA collection)
  const fetchPedidosProgramados = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'CAPTURA'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      const currentSender = String(usuarioActual || '').toUpperCase().trim();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const est = data.ESTADO || data.estado || '';
        const docEnvia = String(data.ENVIA || '').toUpperCase().trim();

        if (String(est).toUpperCase() === 'PROGRAMADO' && docEnvia === currentSender) {
          list.push({ ...data, id: docSnap.id });
        }
      });

      // Sort logically descending by custom timestamp values
      list.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toDate === 'function') {
            try { return val.toDate().getTime(); } catch (e) {}
          }
          if (val.seconds !== undefined) {
             return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
          }
          if (val instanceof Date) {
            return val.getTime();
          }
          const parsed = Date.parse(val);
          if (!isNaN(parsed)) return parsed;
          return 0;
        };

        const msA = getMs(a["Marca temporal"]) || getMs(a["id"]);
        const msB = getMs(b["Marca temporal"]) || getMs(b["id"]);
        
        if (msA || msB) {
          return msB - msA;
        }

        const keyA = String(a["Marca temporal"] || a["id"] || "");
        const keyB = String(b["Marca temporal"] || b["id"] || "");
        return keyB.localeCompare(keyA);
      });

      setProgramadosColumns([
        'ESTADO',
        'Marca temporal',
        'NOMBRE DE QUIEN RECIBE',
        'APELLIDO DE QUIEN RECIBE',
        'DIRECCION',
        'ZONA',
        'TELEFONO',
        'COBRAR',
        'CONTENIDO',
        'REFERENCIA DEL DOMICILIO'
      ]);
      setPedidosProgramados(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'CAPTURA');
      showToast('No se pudieron recuperar tus pedidos programados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pedidos en Proceso (RUTA collection matches today)
  const fetchPedidosEnProceso = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'RUTA'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      const keysSet = new Set<string>();
      const currentSender = String(usuarioActual || '').toUpperCase().trim();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docEnvia = String(data.ENVIA || '').toUpperCase().trim();

        if (docEnvia === currentSender) {
          const item = { ...data, id: docSnap.id };
          list.push(item);
          Object.keys(data).forEach(k => keysSet.add(k));
        }
      });

      const activeStates = ["EN RECOLECCION", "EN RUTA", "ENTREGADO", "VISITADO"];
      const filtered = list.filter(p => {
        const est = String(p.ESTADO || p.estado || '').toUpperCase();
        const matchesState = activeStates.includes(est);
        return matchesState && isShipmentFromToday(p);
      });

      // Set clean display tables
      setPedidosEnProceso(filtered);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'RUTA');
      showToast('Error al cargar la ruta activa en proceso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Clientes histoy grouped by RECIBE Client (from RUTA collection)
  const fetchClientesAgrupados = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'RUTA'));
      const querySnapshot = await getDocs(q);
      const grouping: Record<string, any> = {};
      const currentSender = String(usuarioActual || '').toUpperCase().trim();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docEnvia = String(data.ENVIA || '').toUpperCase().trim();

        if (docEnvia === currentSender) {
          const name = String(data.RECIBE || data["NOMBRE DE QUIEN RECIBE"] || '').toUpperCase().trim();
          if (name) {
            if (!grouping[name]) {
              grouping[name] = {
                nombre: name,
                direccion: String(data.DIRECCION || '').toUpperCase().trim(),
                telefono: String(data.TELEFONO || '').trim(),
                cantidadPedidos: 0
              };
            }
            grouping[name].cantidadPedidos += 1;
          }
        }
      });

      const list = Object.values(grouping);
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setTodosClientes(list);
      setSugerenciasClientes(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'RUTA');
      showToast('Error al procesar clientes históricos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search Filter triggers
  useEffect(() => {
    if (!buscarCliente.trim()) {
      setSugerenciasClientes(todosClientes);
    } else {
      const val = buscarCliente.toUpperCase().trim();
      const filtered = todosClientes.filter(c => 
        c.nombre.includes(val) || 
        c.direccion.includes(val) ||
        c.telefono.includes(val)
      );
      setSugerenciasClientes(filtered);
    }
  }, [buscarCliente, todosClientes]);

  // Fetch shipments last 70 days from RUTA for consulta view
  const fetchConsultaEnvios70Dias = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'RUTA'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      const currentSender = String(usuarioActual || '').toUpperCase().trim();
      const cutoffTime = Date.now() - (70 * 24 * 60 * 60 * 1000);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docEnvia = String(data.ENVIA || '').toUpperCase().trim();

        if (docEnvia === currentSender) {
          const item = { ...data, id: docSnap.id };
          // Check date to ensure only recent packets are loaded
          const dateVal = data["FECHA DE ENV"] || data["fecha_env"] || data["FECHA"] || data["fecha"] || '';
          let itemMs = Date.now();
          if (dateVal) {
            if (typeof dateVal.toDate === 'function') {
              itemMs = dateVal.toDate().getTime();
            } else if (dateVal instanceof Date) {
              itemMs = dateVal.getTime();
            } else if (dateVal.seconds !== undefined) {
              itemMs = dateVal.seconds * 1000;
            } else {
              const str = String(dateVal).split(' ')[0];
              if (str.includes('/')) {
                const pts = str.split('/');
                if (pts.length === 3) {
                  itemMs = new Date(parseInt(pts[2],10), parseInt(pts[1],10)-1, parseInt(pts[0],10)).getTime();
                }
              } else {
                const parsed = Date.parse(str);
                if (!isNaN(parsed)) itemMs = parsed;
              }
            }
          }
          if (itemMs >= cutoffTime) {
            list.push(item);
          }
        }
      });

      // Sort recent first
      list.sort((a,b) => {
        const getValMs = (t: any) => {
          if (!t) return 0;
          if (typeof t.toDate === 'function') return t.toDate().getTime();
          if (t.seconds !== undefined) return t.seconds * 1000;
          return Date.parse(t) || 0;
        };
        return getValMs(b["FECHA DE ENV"] || b["FECHA"]) - getValMs(a["FECHA DE ENV"] || a["FECHA"]);
      });

      setConsultaEnvios(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'RUTA');
      showToast('Error al recuperar consulta de envíos históricos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch report records from REP_DIA collection filtered by logged-in client
  const fetchReporteDia = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'REP_DIA'), where('R_ENVIA', '==', usuarioActual));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ ...data, id: docSnap.id });
      });

      // Sort recent date descending (string e.g. "15/12/2025")
      const parseFecha = (fechaStr: any): Date => {
        if (!fechaStr) return new Date(0);
        const str = String(fechaStr).trim().split(' ')[0];
        const parts = str.split('/');
        if (parts.length !== 3) return new Date(0);
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date(0);
        return new Date(year, month, day);
      };

      list.sort((a, b) => {
        const msA = parseFecha(a.R_FECHA).getTime();
        const msB = parseFecha(b.R_FECHA).getTime();
        return msB - msA;
      });

      setReporteDiaLog(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'REP_DIA');
      showToast('Ocurrió un problema al obtener el Reporte General.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sign in sequence
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Por favor introduce tu correo y contraseña.', 'error');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword.trim());
      showToast('¡Sesión iniciada correctamente! Bienvenido. 🗝️', 'success');
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      console.error("Login auth failure:", err);
      showToast('Credenciales incorrectas o problemas al conectar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sign up seller sequence with exact collection format
  const handleRegister = async () => {
    if (!regEmail || !regPassword || !regUserNombre || !regNombrePila || !regDireccion || !regTelefono || !regRubro) {
      showToast('Por favor completa todos los campos requeridos.', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('La contraseña debe poseer al menos 6 caracteres.', 'error');
      return;
    }
    if (!/^[0-9]{10}$/.test(regTelefono)) {
      showToast('El teléfono debe tener exactamente 10 dígitos.', 'error');
      return;
    }

    isRegisteringRef.current = true;
    setLoading(true);
    try {
      // Create user auth in Firebase
      let authUser;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword.trim());
        authUser = userCred.user;
      } catch (authErr: any) {
        showToast(`Error de registro: ${authErr.message || authErr}`, 'error');
        isRegisteringRef.current = false;
        setLoading(false);
        return;
      }

      // Check duplications for USER_NOMBRE
      const qNombre = query(
        collection(db, 'USUARIOS'),
        where('USER_NOMBRE', '==', regUserNombre.toUpperCase().trim())
      );
      const snapshotNombre = await getDocs(qNombre);
      if (!snapshotNombre.empty) {
        showToast('Este nombre de negocio ya se encuentra registrado.', 'error');
        await authUser.delete();
        isRegisteringRef.current = false;
        setLoading(false);
        return;
      }

      // Get maximum number in ID_USER across current registered users in collection 'USUARIOS'
      let maxIdVal = 0;
      try {
        const qMax = query(collection(db, 'USUARIOS'), orderBy('ID_USER', 'desc'), limit(1));
        const snapMax = await getDocs(qMax);
        if (!snapMax.empty) {
          const data = snapMax.docs[0].data();
          maxIdVal = Number(data.ID_USER || data.USER_NUM || 0);
        } else {
          // Fallback to USER_NUM order
          const qMaxNum = query(collection(db, 'USUARIOS'), orderBy('USER_NUM', 'desc'), limit(1));
          const snapMaxNum = await getDocs(qMaxNum);
          if (!snapMaxNum.empty) {
            const dataNum = snapMaxNum.docs[0].data();
            maxIdVal = Number(dataNum.ID_USER || dataNum.USER_NUM || 0);
          }
        }
      } catch (orderErr) {
        console.warn("Could not query max user ID via orderBy descending:", orderErr);
        // Fallback: search all docs sequentially
        try {
          const snapshotAll = await getDocs(collection(db, 'USUARIOS'));
          snapshotAll.forEach((doc) => {
            const data = doc.data();
            const idUserVal = Number(data.ID_USER || data.USER_NUM || 0);
            if (idUserVal > maxIdVal) {
              maxIdVal = idUserVal;
            }
          });
        } catch (allErr) {
          console.error("Failed fallback listing all users for ID_USER:", allErr);
          // High-safety random-base fallback so user is never locked out of signup
          maxIdVal = Math.floor(Date.now() / 1000) - 1700000000;
        }
      }
      const nextNum = maxIdVal + 1;

      // Format date in DD/MM/AAAA
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateStr = `${dd}/${mm}/${yyyy}`;

      // Construct payload mimicking the required specs perfectly
      const newSellerDoc = {
        "$$$ EN SOBRE": 0,
        "ARTEAGA": 0,
        "CONTRASEÑA": regPassword.trim(),
        "DESCUENTO": 0,
        "DIRECCION": regDireccion.toUpperCase().trim(),
        "DIRECCION ALTERNA": "",
        "ESP_1": 0,
        "ESP_2": 0,
        "ESP_3": 0,
        "ID_USER": nextNum,
        "NOMBRE DE PILA": regNombrePila.toUpperCase().trim(),
        "RAMOS": 100,
        "RUBRO": regRubro.toUpperCase().trim(),
        "SALTILLO": 80,
        "STA MARIA": 110,
        "TELEFONO": Number(regTelefono.trim()),
        "USER_CORREO": regEmail.toLowerCase().trim(),
        "USER_DIN_COP": 0,
        "USER_DIN_DEBE": 0,
        "USER_DIN_DIA": 0,
        "USER_DIN_ENT": 0,
        "USER_ENV_CONF": 0,
        "USER_ENV_ENT": 0,
        "USER_ENV_PROG": 0,
        "USER_ESTATUS": "ACTIVO",
        "USER_FECHA": dateStr,
        "USER_NOMBRE": regUserNombre.toUpperCase().trim(),
        "USER_NUM": nextNum,
        "USER_PAG_DIA": 0,
        "USER_RECOLECTO": "",
        "USER_ROL": "VENDEDOR"
      };

      // Set document with document name as the user's authenticating UID to ensure Firestore permissions compatibility
      if (authUser) {
        await setDoc(doc(db, 'USUARIOS', authUser.uid), newSellerDoc);
      } else {
        throw new Error("No authenticated user profile after auth registration.");
      }
      
      // Update state manually so UI binds everything smoothly
      setUsuarioActual(regUserNombre.toUpperCase().trim());
      setPerfilDocId(authUser ? authUser.uid : String(nextNum));
      setPerfilDatosCompletos(newSellerDoc as any);
      setPerfilPass(regPassword.trim());
      setPerfilNombrePila(regNombrePila.toUpperCase().trim());
      setPerfilTelefono(regTelefono.trim());
      setPerfilDireccion(regDireccion.toUpperCase().trim());
      setPerfilRubro(regRubro.toUpperCase().trim());
      
      sessionStorage.setItem('usuarioActual', regUserNombre.toUpperCase().trim());
      
      isRegisteringRef.current = false;
      showToast('¡Registro completado e inicializado exitosamente! 🎉', 'success');
      setActiveVista('menu');
    } catch (err) {
      console.error("General signup failure:", err);
      showToast('No se pudo registrar la información de perfil en Firestore.', 'error');
      isRegisteringRef.current = false;
      try {
        await signOut(auth);
      } catch (soErr) {}
    } finally {
      setLoading(false);
    }
  };

   const handleCapturaKeyDown = (e: React.KeyboardEvent, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (currentField) {
        case 'nombre':
          apellidoRecibeRef.current?.focus();
          break;
        case 'apellido':
          direccionRef.current?.focus();
          break;
        case 'direccion':
          zonaRef.current?.focus();
          break;
        case 'zona':
          telefonoRef.current?.focus();
          break;
        case 'telefono':
          cobrarRef.current?.focus();
          break;
        case 'cobrar':
          contenidoRef.current?.focus();
          break;
        case 'contenido':
          referenciaRef.current?.focus();
          break;
        case 'referencia':
          if (
            nombreRecibe.trim() &&
            apellidoRecibe.trim() &&
            direccionInput.trim() &&
            zonaSelect &&
            telefonoInput.trim() &&
            cobrarInput.trim() &&
            contenidoInput.trim() &&
            referenciaInput.trim()
          ) {
            const mockEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSometerCaptura(mockEvent);
          } else {
            showToast('Por favor completa todos los campos para poder guardar.', 'error');
            if (!nombreRecibe.trim()) nombreRecibeRef.current?.focus();
            else if (!apellidoRecibe.trim()) apellidoRecibeRef.current?.focus();
            else if (!direccionInput.trim()) direccionRef.current?.focus();
            else if (!zonaSelect) zonaRef.current?.focus();
            else if (!telefonoInput.trim()) telefonoRef.current?.focus();
            else if (!cobrarInput.trim()) cobrarRef.current?.focus();
            else if (!contenidoInput.trim()) contenidoRef.current?.focus();
            else referenciaRef.current?.focus();
          }
          break;
        default:
          break;
      }
    }
  };

  // Submit Captura shipping order
  const handleSometerCaptura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !nombreRecibe.trim() || 
      !apellidoRecibe.trim() || 
      !direccionInput.trim() || 
      !zonaSelect || 
      !telefonoInput.trim() ||
      cobrarInput.trim() === '' ||
      !contenidoInput.trim() ||
      !referenciaInput.trim()
    ) {
      showToast('Por favor completa TODOS los campos del envío para poder programarlo.', 'error');
      return;
    }
    if (!/^[0-9]{10}$/.test(telefonoInput.trim())) {
      showToast('El teléfono debe tener un formato de 10 dígitos válidos.', 'error');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const nuevoPedido = {
        "Marca temporal": Timestamp.fromDate(now),
        "id": Timestamp.fromDate(now),
        ENVIA: usuarioActual || '',
        "NOMBRE DE QUIEN RECIBE": nombreRecibe.trim().toUpperCase(),
        "APELLIDO DE QUIEN RECIBE": apellidoRecibe.trim().toUpperCase(),
        DIRECCION: direccionInput.trim().toUpperCase(),
        ZONA: zonaSelect.toUpperCase().trim(),
        TELEFONO: Number(telefonoInput.trim()),
        COBRAR: Number(cobrarInput) || 0,
        ESTADO: "PROGRAMADO",
        CONTENIDO: contenidoInput.trim().toUpperCase(),
        "REFERENCIA DEL DOMICILIO": referenciaInput.trim().toUpperCase()
      };

      const safeId = formattedDate.replace(/\//g, '-');
      await setDoc(doc(db, 'CAPTURA', safeId), nuevoPedido);
      showToast('¡Pedido guardado correctamente! 🎉', 'success');

      // Clear capturing inputs
      setNombreRecibe('');
      setApellidoRecibe('');
      setDireccionInput('');
      setZonaSelect('');
      setTelefonoInput('');
      setCobrarInput('');
      setReferenciaInput('');
      setContenidoInput('');

      setActiveVista('programados');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'CAPTURA');
      showToast('Ocurrió un problema al guardar el pedido.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Inline table-mode edits save triggers
  const handleSaveInlineEdit = async (id: string) => {
    setLoading(true);
    try {
      const orderDoc = doc(db, 'CAPTURA', id);
      const sanitized: Record<string, any> = {};

      Object.keys(editValues).forEach((key) => {
        if (key === 'id') return;
        const val = editValues[key];
        const keyUpper = key.toUpperCase();

        if (keyUpper === 'COBRAR' || keyUpper === 'TELEFONO') {
          sanitized[key] = Number(val) || 0;
        } else if (typeof val === 'string') {
          if (
            keyUpper.includes('FOTO') ||
            keyUpper.includes('FECHA_ENT') ||
            keyUpper.includes('HORA_ENT') ||
            keyUpper.includes('LOCALIZACION') ||
            keyUpper === 'REPORTE'
          ) {
            sanitized[key] = val.trim();
          } else {
            sanitized[key] = val.toUpperCase().trim();
          }
        } else {
          sanitized[key] = val;
        }
      });

      await updateDoc(orderDoc, sanitized);
      showToast('¡Pedido actualizado de forma correcta! 💾', 'success');
      setEditingPedidoId(null);
      fetchPedidosProgramados();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `CAPTURA/${id}`);
      showToast('No se pudieron guardar las modificaciones en Firestore.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete captured pedidos trigger with visual prompts
  const handleEliminarPedido = (id: string, clientName: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Envío 🗑️',
      message: `¿Seguro que deseas eliminar el envío programado para ${clientName}? Esta acción es irreversible.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, 'CAPTURA', id));
          showToast('Envío eliminado correctamente.', 'success');
          fetchPedidosProgramados();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `CAPTURA/${id}`);
          showToast('Ocurrió un error al eliminar el pedido programado.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Convert historic customer records to scheduled CAPTURA
  const handleEnviarACapturaCliente = (c: any) => {
    setFrecuenteContenido('');
    setFrecuenteCobrar('');
    setFrecuenteModal({
      show: true,
      cliente: c
    });
  };

  const handleConfirmFrecuente = async () => {
    if (!frecuenteModal) return;
    const { cliente } = frecuenteModal;
    if (!frecuenteContenido.trim() || frecuenteCobrar.trim() === '') {
      showToast('Por favor completa todos los campos del envío.', 'error');
      return;
    }

    const cobrarNumber = Number(frecuenteCobrar) || 0;
    setLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const splitNames = cliente.nombre.split(' ');
      const fName = splitNames[0] || '';
      const lName = splitNames.slice(1).join(' ') || '';

      const nuevoPedido = {
        "Marca temporal": Timestamp.fromDate(now),
        "id": Timestamp.fromDate(now),
        ENVIA: usuarioActual || '',
        "NOMBRE DE QUIEN RECIBE": fName.toUpperCase().trim(),
        "APELLIDO DE QUIEN RECIBE": lName.toUpperCase().trim(),
        DIRECCION: String(cliente.direccion || '').toUpperCase().trim(),
        ZONA: 'SALTILLO', // Default to capital zone
        TELEFONO: Number(cliente.telefono) || 0,
        COBRAR: cobrarNumber,
        ESTADO: "PROGRAMADO",
        CONTENIDO: frecuenteContenido.toUpperCase().trim(),
        "REFERENCIA DEL DOMICILIO": ''
      };

      const safeId = formattedDate.replace(/\//g, '-');
      await setDoc(doc(db, 'CAPTURA', safeId), nuevoPedido);
      showToast('¡Cliente histórico enviado a Captura con éxito! 🎉', 'success');
      setBuscarCliente('');
      setFrecuenteModal(null);
      setActiveVista('clientes');
      fetchClientesAgrupados();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'Base De Datos General');
      showToast('Error al registrar pedido de cliente frecuente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save profile update screen ensuring field standards
  const handleSavePerfil = async () => {
    if (!perfilPass || !perfilNombrePila || !perfilTelefono || !perfilDireccion || !perfilRubro) {
      showToast('Por favor completa todos los campos requeridos.', 'error');
      return;
    }
    if (!/^[0-9]{10}$/.test(perfilTelefono.trim())) {
      showToast('El teléfono debe tener un formato de 10 dígitos exactos.', 'error');
      return;
    }
    if (!perfilDocId) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'USUARIOS', perfilDocId);
      await updateDoc(userRef, {
        "CONTRASEÑA": perfilPass.trim(),
        "NOMBRE DE PILA": perfilNombrePila.toUpperCase().trim(),
        TELEFONO: Number(perfilTelefono.trim()),
        DIRECCION: perfilDireccion.toUpperCase().trim(),
        RUBRO: perfilRubro.toUpperCase().trim(),
        USER_FECHA: Timestamp.fromDate(new Date())
      });
      showToast('¡Perfil actualizado con éxito! 💾', 'success');
      setTimeout(() => setActiveVista('menu'), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `USUARIOS/${perfilDocId}`);
      showToast('Ocurrió un error al guardar los cambios en el perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Log out sequence
  const handleCerrarSesion = () => {
    setConfirmModal({
      show: true,
      title: 'Cerrar Sesión 🚪',
      message: '¿Estás seguro que deseas desconectarte y salir del sistema?',
      onConfirm: async () => {
        setLoading(true);
        try {
          await signOut(auth);
          setUsuarioActual(null);
          setUsuarioEmail(null);
          showToast('Sesión finalizada correctamente. ¡Vuelve pronto!', 'success');
          setActiveVista('login');
        } catch (e) {
          showToast('Error al cerrar la sesión.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Filtered array of Consulta last 70 days
  const filteredConsulta = consultaEnvios.filter(p => {
    const term = searchConsulta.toUpperCase().trim();
    const matchesTerm = !term || 
      String(p.RECIBE || '').toUpperCase().includes(term) ||
      String(p.NGUIA || '').toUpperCase().includes(term) ||
      String(p.DIRECCION || '').toUpperCase().includes(term);

    const matchStatus = !filterStatusConsulta || 
      String(p.ESTADO || '').toUpperCase() === filterStatusConsulta.toUpperCase();

    return matchesTerm && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#18100A] text-gray-100 flex flex-col relative select-none">
      
      {/* ===================== TOASTS ALERTS PANEL ===================== */}
      <div className="fixed top-4 right-4 z-[99999] space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-350 translate-y-0 opacity-100 animate-fade-in pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-[#1C1813] border-emerald-600/60 text-emerald-300'
                : 'bg-[#1C1813] border-rose-600/60 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 text-xs sm:text-sm font-medium pr-1">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 hover:text-white transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ===================== HEADER ACCENT BAR ===================== */}
      {usuarioActual && activeVista !== 'login' && activeVista !== 'registro' && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-[#140D08]/90 backdrop-blur border-b border-[#8B5A2B]/20 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="FICERT Logo" 
              className="w-12 h-12 rounded-lg object-contain border border-[#FF7300] p-0.5" 
              referrerPolicy="no-referrer" 
            />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wider font-mono">FICERT</h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider">VENDEDOR | {usuarioActual.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveVista('menu')}
              className={`p-2 rounded-lg transition text-xs font-bold font-mono tracking-wider uppercase ${
                activeVista === 'menu' ? 'bg-[#8B5A2B] text-black' : 'hover:bg-neutral-800 text-gray-300'
              }`}
            >
              MENU
            </button>
            <button
              onClick={handleCerrarSesion}
              className="p-2 text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* ===================== CORE WORKSPACE LAYOUT ===================== */}
      <main className={`flex-grow flex flex-col justify-center items-center px-4 ${usuarioActual ? 'pt-20 pb-10' : ''}`}>
        
        {/* ===================== INITIAL STARTUP SPLASH SCREEN ===================== */}
        {initialSplash && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-[#140D08] overflow-hidden select-none">
            <img 
              src="/logoinicio.png" 
              alt="FICERT Inicio" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* ===================== LOADER SPINNER ===================== */}
        {loading && !initialSplash && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#140D08] select-none">
            {/* Background image covering the full screen */}
            <img 
              src="/logoinicio.png" 
              alt="FICERT" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Semi-transparent dark contrast layer */}
            <div className="absolute inset-0 bg-black/35 backdrop-blur-xs" />

            {/* Spinner centered in position on top of the image */}
            <div className="relative z-10 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                {/* Custom vivid blue spinner */}
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-blue-400 tracking-widest font-mono uppercase bg-black/60 px-4 py-2 rounded-full border border-blue-500/20 shadow-lg inline-block">
                CARGANDO...
              </p>
            </div>
          </div>
        )}

        {/* ===================== VIEW: LOGIN ===================== */}
        {activeVista === 'login' && !usuarioActual && (
          <section className="w-full max-w-md bg-[#23170E]/80 border border-[#8B5A2B]/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in my-8">
            <div className="text-center space-y-2">
              <img 
                src="/logo.png" 
                alt="FICERT Logo" 
                className="w-36 sm:w-44 mx-auto rounded-xl object-contain border border-[#FF7300] p-1 mb-2" 
                referrerPolicy="no-referrer" 
              />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-widest font-mono uppercase">FICERT</h2>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">PANEL DE CONTROL DE VENDEDORES</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Correo Registrado *</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Contraseña del sistema"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8B5A2B] hover:bg-[#6e4620] text-black font-bold font-mono text-sm rounded-lg tracking-wider transition duration-200 mt-2 cursor-pointer shadow-lg"
              >
                LOG IN ACCESO
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                ¿Aún no tienes una cuenta de vendedor?{' '}
                <button
                  type="button"
                  onClick={() => setActiveVista('registro')}
                  className="text-[#4080FF] hover:underline font-bold"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </section>
        )}

        {/* ===================== VIEW: REGISTRO/SIGNUP ===================== */}
        {activeVista === 'registro' && (
          <section className="w-full max-w-lg bg-[#23170E]/80 border border-[#8B5A2B]/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in my-8">
            <div className="text-center space-y-1">
              <img 
                src="/logo.png" 
                alt="FICERT Logo" 
                className="w-36 sm:w-44 mx-auto rounded-xl object-contain border border-[#FF7300] p-1 mb-2" 
                referrerPolicy="no-referrer" 
              />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-widest font-mono uppercase">NUEVO VENDEDOR</h2>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">UNETE A NUESTA RED DE VENTAS</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Correo Electrónico *</label>
                  <input
                    ref={regEmailRef}
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        regPasswordRef.current?.focus();
                      }
                    }}
                    placeholder="email@correo.com"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Contraseña *</label>
                  <div className="relative">
                    <input
                      ref={regPasswordRef}
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          regUserNombreRef.current?.focus();
                        }
                      }}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Nombre del Negocio (Marca Principal) *</label>
                <input
                  ref={regUserNombreRef}
                  type="text"
                  value={regUserNombre}
                  onChange={(e) => setRegUserNombre(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      regNombrePilaRef.current?.focus();
                    }
                  }}
                  placeholder="Ej: Tienda Central, Paola Shop"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Nombre de Pila *</label>
                  <input
                    ref={regNombrePilaRef}
                    type="text"
                    value={regNombrePila}
                    onChange={(e) => setRegNombrePila(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        regTelefonoRef.current?.focus();
                      }
                    }}
                    placeholder="Nombre del titular"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Teléfono de Contacto *</label>
                  <input
                    ref={regTelefonoRef}
                    type="tel"
                    maxLength={10}
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        regDireccionRef.current?.focus();
                      }
                    }}
                    placeholder="Teléfono 10 dígitos"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white font-mono inline-block outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Dirección Física Completa *</label>
                <input
                  ref={regDireccionRef}
                  type="text"
                  value={regDireccion}
                  onChange={(e) => setRegDireccion(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      regRubroRef.current?.focus();
                    }
                  }}
                  placeholder="Calle, Número, Colonia, Municipio"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Rubro o Giro Comercial *</label>
                <input
                  ref={regRubroRef}
                  type="text"
                  value={regRubro}
                  onChange={(e) => setRegRubro(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRegister();
                    }
                  }}
                  placeholder="Ej: Concept Store, Ropa, Electrónica"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                />
              </div>

              <div className="flex flex-row-reverse gap-4 pt-2">
                <button
                  ref={regBtnRef}
                  type="submit"
                  className="flex-1 py-3 bg-[#8B5A2B] hover:bg-[#6e4620] text-black font-bold font-mono text-xs rounded-lg uppercase tracking-wider transition"
                >
                  REGISTRARSE
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVista('login')}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold font-mono text-xs rounded-lg uppercase tracking-wider transition"
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ===================== VIEW: MENU / HOME DASHBOARD ===================== */}
        {activeVista === 'menu' && usuarioActual && (
          <section className="w-full max-w-4xl space-y-6 animate-fade-in">
            {/* Seller profile overview */}
            <div className="bg-[#23170E]/70 border border-[#8B5A2B]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left self-stretch justify-center md:justify-start">
                <div className="w-14 h-14 bg-[#8B5A2B] rounded-2xl flex items-center justify-center text-2xl font-bold text-black border border-[#8B5A2B]/40 shrink-0">
                  🏬
                </div>
                <div>
                  <h3 className="text-[#8B5A2B] font-bold font-mono tracking-wider text-xs uppercase">Vendedor Autorizado</h3>
                  <h2 className="text-xl font-bold font-mono tracking-wider text-white uppercase mt-0.5 truncate">{usuarioActual}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{usuarioEmail}</p>
                </div>
              </div>

              {/* Financial metrics read directly from the user's specific collection profile values */}
              <div className="grid grid-cols-2 gap-4 h-full w-full md:w-auto self-stretch">
                <button
                  type="button"
                  onClick={() => setActiveVista('reporte')}
                  className="bg-[#18100A] hover:bg-[#23170E] border border-[#8B5A2B]/20 hover:border-[#FF7300]/50 p-3 rounded-xl flex items-center gap-3 transition cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#8B5A2B]/40 group"
                >
                  <div className="p-2 bg-emerald-950/30 group-hover:bg-emerald-900/40 border border-emerald-500/20 group-hover:border-emerald-500/50 text-emerald-400 rounded-lg shrink-0 transition">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-100 uppercase tracking-widest font-mono group-hover:text-emerald-400 transition" >En Sobre</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">
                      ${(Number(perfilDatosCompletos?.['$$$ EN SOBRE'] ?? 0) >= 0 ? Number(perfilDatosCompletos?.['$$$ EN SOBRE'] ?? 0) : 0).toFixed(2)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVista('reporte')}
                  className="bg-[#18100A] hover:bg-[#23170E] border border-[#8B5A2B]/20 hover:border-[#FF7300]/50 p-3 rounded-xl flex items-center gap-3 transition cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#8B5A2B]/40 group"
                >
                  <div className="p-2 bg-rose-950/30 group-hover:bg-rose-900/40 border border-rose-500/20 group-hover:border-rose-500/50 text-rose-400 rounded-lg shrink-0 transition">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-100 uppercase tracking-widest font-mono group-hover:text-rose-400 transition">Saldo Pendiente</p>
                    <p className="text-sm font-bold text-rose-400 font-mono">
                      ${(Number(perfilDatosCompletos?.['$$$ EN SOBRE'] ?? 0) < 0 ? Math.abs(Number(perfilDatosCompletos?.['$$$ EN SOBRE'] ?? 0)) : 0).toFixed(2)}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Launcher Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              
              {/* LAUNCHER: Captura de Pedidos */}
              <button
                onClick={() => setActiveVista('captura')}
                className="bg-[#23170E]/50 hover:bg-[#2F1F13]/60 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/60 p-5 rounded-2xl text-left transition duration-200 transform hover:-translate-y-1 group flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden"
              >
                <div className="bg-[#8B5A2B]/15 text-[#8B5A2B] group-hover:text-amber-300 w-10 h-10 rounded-xl flex items-center justify-center border border-[#8B5A2B]/20 transition-all">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white group-hover:text-amber-300 transition-colors">Capturar Envío</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Registrar un nuevo paquete o pedido para que sea programado para entrega.</p>
                </div>
                <div className="absolute right-4 bottom-4 transition duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-amber-500/30 group-hover:text-amber-500" />
                </div>
              </button>

              {/* LAUNCHER: Pedidos Programados */}
              <button
                onClick={() => setActiveVista('programados')}
                className="bg-[#23170E]/50 hover:bg-[#2F1F13]/60 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/60 p-5 rounded-2xl text-left transition duration-200 transform hover:-translate-y-1 group flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden"
              >
                <div className="bg-amber-950/30 text-[#8B5A2B] group-hover:text-amber-300 w-10 h-10 rounded-xl flex items-center justify-center border border-amber-500/20 transition-all">
                  <Package className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white group-hover:text-amber-300 transition-colors">Pedidos Programados</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Verifica y gestiona tus pedidos antes de que salgan a ruta.</p>
                </div>
                <div className="absolute right-4 bottom-4 transition duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-amber-500/30 group-hover:text-amber-500" />
                </div>
              </button>

              {/* LAUNCHER: Ruta en Proceso */}
              <button
                onClick={() => setActiveVista('enproceso')}
                className="bg-[#23170E]/50 hover:bg-[#2F1F13]/60 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/60 p-5 rounded-2xl text-left transition duration-200 transform hover:-translate-y-1 group flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden"
              >
                <div className="bg-sky-950/30 text-sky-400 group-hover:text-sky-300 w-10 h-10 rounded-xl flex items-center justify-center border border-sky-500/10 transition-all">
                  <Navigation className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white group-hover:text-sky-300 transition-colors">Envíos de Hoy</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Seguimiento de entregas, recolectas y reportes en tiempo real para el día de hoy.</p>
                </div>
                <div className="absolute right-4 bottom-4 transition duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-sky-500/30 group-hover:text-sky-400" />
                </div>
              </button>

              {/* LAUNCHER: Clientes Históricos */}
              <button
                onClick={() => setActiveVista('clientes')}
                className="bg-[#23170E]/50 hover:bg-[#2F1F13]/60 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/60 p-5 rounded-2xl text-left transition duration-200 transform hover:-translate-y-1 group flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden"
              >
                <div className="bg-indigo-950/30 text-indigo-400 group-hover:text-indigo-300 w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/10 transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white group-hover:text-indigo-300 transition-colors">Clientes Frecuentes</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Directorio integrado para reenviar clientes históricos a captura inmediatamente.</p>
                </div>
                <div className="absolute right-4 bottom-4 transition duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-indigo-500/30 group-hover:text-indigo-400" />
                </div>
              </button>

              {/* LAUNCHER: Consulta general de envíos */}
              <button
                onClick={() => setActiveVista('consulta')}
                className="bg-[#23170E]/50 hover:bg-[#2F1F13]/60 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/60 p-5 rounded-2xl text-left transition duration-200 transform hover:-translate-y-1 group flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden"
              >
                <div className="bg-teal-950/30 text-teal-400 group-hover:text-teal-300 w-10 h-10 rounded-xl flex items-center justify-center border border-teal-500/10 transition-all">
                  <Search className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white group-hover:text-teal-300 transition-colors">Historial 70 Días</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Audita y rastrea todos tus envíos programados y entregas en los últimos 70 días.</p>
                </div>
                <div className="absolute right-4 bottom-4 transition duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-teal-500/30 group-hover:text-teal-400" />
                </div>
              </button>

              {/* LAUNCHER: Editar Perfil */}
              <button
                onClick={() => setActiveVista('perfil')}
                className="bg-[#23170E]/50 hover:bg-[#2F1F13]/60 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/60 p-5 rounded-2xl text-left transition duration-200 transform hover:-translate-y-1 group flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden"
              >
                <div className="bg-neutral-950/30 text-neutral-400 group-hover:text-neutral-300 w-10 h-10 rounded-xl flex items-center justify-center border border-neutral-500/20 transition-all">
                  <User className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white group-hover:text-neutral-300 transition-colors">Mi Perfil</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Actualiza tu información, contraseña de seguridad y direcciones de contacto.</p>
                </div>
                <div className="absolute right-4 bottom-4 transition duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5 text-neutral-500/30 group-hover:text-neutral-300" />
                </div>
              </button>

            </div>
          </section>
        )}

        {/* ===================== VIEW: CAPTURA FORM ===================== */}
        {activeVista === 'captura' && usuarioActual && (
          <section className="w-full max-w-2xl bg-[#23170E]/70 border border-[#8B5A2B]/20 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in my-4 relative">
            <button
              onClick={() => setActiveVista('menu')}
              className="absolute top-4 left-4 p-2 text-[#8B5A2B] hover:bg-neutral-800 rounded-lg transition shrink-0 hidden sm:flex items-center gap-2 text-xs font-mono font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> VOLVER
            </button>
            
            <div className="text-center space-y-1 pt-6 sm:pt-0">
              <div className="text-3xl">📝</div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-widest font-mono uppercase">CAPTURAR ENVÍO NUEVO</h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Registra y programa un paquete</p>
            </div>

            <form onSubmit={handleSometerCaptura} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Nombre de Quien Recibe *</label>
                  <input
                    type="text"
                    ref={nombreRecibeRef}
                    value={nombreRecibe}
                    onChange={(e) => setNombreRecibe(e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleCapturaKeyDown(e, 'nombre')}
                    placeholder="NOMBRES"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Apellido de Quien Recibe *</label>
                  <input
                    type="text"
                    ref={apellidoRecibeRef}
                    value={apellidoRecibe}
                    onChange={(e) => setApellidoRecibe(e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleCapturaKeyDown(e, 'apellido')}
                    placeholder="APELLIDOS"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Dirección de Entrega (Calle y Número) *</label>
                <input
                  type="text"
                  ref={direccionRef}
                  value={direccionInput}
                  onChange={(e) => setDireccionInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleCapturaKeyDown(e, 'direccion')}
                  placeholder="DIRECCIÓN DE ENTREGA"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Zona Geográfica *</label>
                  <select
                    ref={zonaRef}
                    value={zonaSelect}
                    onChange={(e) => setZonaSelect(e.target.value)}
                    onKeyDown={(e) => handleCapturaKeyDown(e, 'zona')}
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none cursor-pointer"
                    required
                  >
                    <option value="">ZONA DE ENTREGA</option>
                    <option value="SALTILLO">SALTILLO</option>
                    <option value="RAMOS">RAMOS</option>
                    <option value="ARTEAGA">ARTEAGA</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Teléfono de Quien Recibe *</label>
                  <input
                    type="tel"
                    ref={telefonoRef}
                    maxLength={10}
                    value={telefonoInput}
                    onChange={(e) => setTelefonoInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => handleCapturaKeyDown(e, 'telefono')}
                    placeholder="10 DÍGITOS"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white font-mono inline-block outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Monto a Cobrar ($) *</label>
                  <input
                    type="number"
                    ref={cobrarRef}
                    value={cobrarInput}
                    onChange={(e) => setCobrarInput(e.target.value)}
                    onKeyDown={(e) => handleCapturaKeyDown(e, 'cobrar')}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white font-mono inline-block outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Contenido del Paquete *</label>
                <input
                  type="text"
                  ref={contenidoRef}
                  value={contenidoInput}
                  onChange={(e) => setContenidoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleCapturaKeyDown(e, 'contenido')}
                  placeholder="EJ: VESTIDO ROJO, MAQUILLAJE, ACCESORIOS"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Entre Calles y Referencias del Domicilio *</label>
                <input
                  type="text"
                  ref={referenciaRef}
                  value={referenciaInput}
                  onChange={(e) => setReferenciaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleCapturaKeyDown(e, 'referencia')}
                  placeholder="EJ: PORTÓN BLANCO, FRENTE A PARQUE, ENTRE ABASOLO Y LEONA VICARIO"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveVista('menu')}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold font-mono transition inline-block uppercase"
                >
                  VOLVER MENU
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#8B5A2B] hover:bg-[#6e4620] text-black font-bold font-mono text-xs rounded-lg transition inline-block uppercase"
                >
                  PROGRAMAR ENVÍO
                </button>
              </div>

            </form>
          </section>
        )}

        {/* ===================== VIEW: PEDIDOS PROGRAMADOS ===================== */}
        {activeVista === 'programados' && usuarioActual && (
          <section className="w-full max-w-6xl space-y-4 animate-fade-in my-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveVista('menu')}
                  className="p-2 border border-[#8B5A2B]/30 hover:bg-neutral-850 rounded-lg transition text-[#8B5A2B]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold font-mono tracking-wider text-white uppercase">Pedidos Programados</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Pedidos en espera de salir a ruta</p>
                </div>
              </div>

              <button
                onClick={() => setActiveVista('captura')}
                className="px-4 py-2 bg-[#8B5A2B] hover:bg-[#6e4620] text-black font-bold font-mono text-xs rounded-lg tracking-wider uppercase flex items-center gap-2 transition"
              >
                <PlusCircle className="w-4 h-4" /> AGREGAR PEDIDO
              </button>
            </div>

            {/* Programmed Table Content */}
            <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl overflow-hidden shadow-2xl">
              {pedidosProgramados.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="text-5xl">🏷️</div>
                  <h3 className="text-md font-bold font-mono text-gray-300 uppercase tracking-wider">No tienes pedidos programados</h3>
                  <p className="text-xs text-gray-400">Todo limpio por aquí. Configura o captura un nuevo pedido para empezar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#140D08]/90 border-b border-[#8B5A2B]/20 text-[#8B5A2B] uppercase font-mono tracking-wider">
                        <th className="px-4 py-3 font-bold text-center">Acciones</th>
                        {programadosColumns.map((col) => (
                          <th key={col} className="px-4 py-3 font-bold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8B5A2B]/10 font-mono">
                      {pedidosProgramados.map((pedido) => {
                        const isEditing = editingPedidoId === pedido.id;
                        return (
                          <tr key={pedido.id} className="hover:bg-[#20150D]/30 transition group">
                            
                            {/* ACTION TRIGGERS COLUMN */}
                            <td className="px-4 py-3 align-middle text-center sticky left-0 bg-[#23170E] z-10">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleSaveInlineEdit(pedido.id)}
                                    className="p-1.5 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/20 rounded-md transition"
                                    title="Guardar Cambios"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPedidoId(null)}
                                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 border border-neutral-600/20 rounded-md transition"
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingPedidoId(pedido.id);
                                      setEditValues({ ...pedido });
                                    }}
                                    className="p-1.5 bg-[#8B5A2B]/10 hover:bg-[#8B5A2B]/30 text-[#8B5A2B] hover:text-amber-300 border border-[#8B5A2B]/10 rounded-md transition"
                                    title="Editar pedido"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleEliminarPedido(pedido.id, `${pedido["NOMBRE DE QUIEN RECIBE"] || ''} ${pedido["APELLIDO DE QUIEN RECIBE"] || ''}`)}
                                    className="p-1.5 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border border-rose-500/10 rounded-md transition"
                                    title="Eliminar pedido"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* FIELDS DISPLAY & INLINE EDIT FIELD VALUE MATCHES */}
                            {programadosColumns.map((col) => {
                              const value = pedido[col];
                              const isEditableField = col !== 'id' && col !== 'Marca temporal' && col !== 'marcaTemporal' && col !== 'ENVIA' && col !== 'ESTADO';

                              let formattedValue = '';
                              if (col === 'Marca temporal') {
                                formattedValue = formatFullTimestamp(value);
                              } else {
                                formattedValue = String(value ?? '');
                              }

                              return (
                                <td key={col} className="px-4 py-3 align-middle text-gray-300">
                                  {isEditing && isEditableField ? (
                                    <input
                                      type={col === 'COBRAR' ? 'number' : 'text'}
                                      value={editValues[col] ?? ''}
                                      onChange={(e) => setEditValues((prev) => ({
                                        ...prev,
                                        [col]: e.target.value
                                      }))}
                                      className="px-2 py-1 bg-[#18100A] text-white border border-[#8B5A2B]/40 focus:border-[#8B5A2B] rounded-md text-xs inline-block outline-none min-w-[140px] max-w-[200px]"
                                    />
                                  ) : (
                                    col === 'ESTADO' ? (
                                      <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-500/20 text-amber-500 rounded text-[10px] font-bold">
                                        {formattedValue}
                                      </span>
                                    ) : col === 'COBRAR' ? (
                                      <span className="text-emerald-400 font-bold">
                                        ${Number(value || 0).toFixed(2)}
                                      </span>
                                    ) : (
                                      formattedValue
                                    )
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================== VIEW: ENVÍOS EN PROCESO ===================== */}
        {activeVista === 'enproceso' && usuarioActual && (
          <section className="w-full max-w-6xl space-y-4 animate-fade-in my-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveVista('menu')}
                className="p-2 border border-[#8B5A2B]/30 hover:bg-neutral-850 rounded-lg transition text-[#8B5A2B]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold font-mono tracking-wider text-white uppercase">En Ruta Hoy</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Mis entregas de hoy en el sistema de mensajería</p>
              </div>
            </div>

            {pedidosEnProceso.length === 0 ? (
              <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl p-12 text-center space-y-2 max-w-4xl mx-auto shadow-2xl">
                <div className="text-5xl">🧭</div>
                <h3 className="text-md font-bold font-mono text-gray-300 uppercase tracking-wider">No tienes envíos reportados hoy</h3>
                <p className="text-xs text-gray-400">Aún no se han asignado paquetes a ruta o tus envíos no han salido el día de hoy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                {pedidosEnProceso.map((pedido) => {
                  const est = String(pedido.ESTADO || '').trim().toUpperCase();
                  
                  // Helper color mapping
                  let statusBg = 'bg-neutral-900 border-neutral-700 text-gray-400';
                  if (est === 'EN RECOLECCION') statusBg = 'bg-amber-950/40 border-amber-500/20 text-amber-400';
                  else if (est === 'EN RUTA') statusBg = 'bg-sky-950/40 border-sky-500/20 text-sky-400';
                  else if (est === 'ENTREGADO') statusBg = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400';
                  else if (est === 'VISITADO') statusBg = 'bg-rose-950/30 border-rose-500/20 text-rose-400';

                  return (
                    <div
                      key={pedido.id}
                      className="bg-[#23170E]/50 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/40 rounded-2xl p-5 shadow-xl transition-all duration-300 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#8B5A2B]/10 pb-3">
                        <span className="text-xs text-gray-400 font-mono font-bold uppercase tracking-wider">
                          GUÍA: {pedido.NGUIA || 'S/N'}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono border ${statusBg}`}>
                          {est}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-3 font-mono text-xs text-gray-300">
                        <div className="col-span-2 space-y-0.5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Destinatario</p>
                          <p className="text-sm font-bold text-white truncate">{pedido.RECIBE || 'S/N'}</p>
                        </div>

                        <div className="col-span-2 space-y-0.5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Dirección física</p>
                          <p className="text-xs truncate">{pedido.DIRECCION || 'S/N'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Zona</p>
                          <p className="text-xs uppercase font-bold text-amber-500">{pedido.ZONA || 'SALTILLO'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Teléfono</p>
                          <p className="text-xs">{pedido.TELEFONO || 'S/N'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Monto a Cobrar</p>
                          <p className="text-xs text-emerald-400 font-bold">
                            ${Number(pedido.ACOBRAR || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fecha Ruta</p>
                          <p className="text-xs">{formatToDDMMAAAA(pedido["FECHA DE ENV"] || pedido["FECHA"])}</p>
                        </div>
                      </div>

                      {/* Display delivery photo evidence links or details if they exist in RUTA */}
                      {(pedido.RELAZO_ESTADO || pedido.status_details) && (
                        <div className="bg-[#18100A] p-2.5 rounded-xl border border-[#8B5A2B]/10 text-[11px] text-gray-400 font-sans italic">
                          💡 Comentario: {pedido.RELAZO_ESTADO || pedido.status_details}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ===================== VIEW: CLIENTES HISTORICOS ===================== */}
        {activeVista === 'clientes' && usuarioActual && (
          <section className="w-full max-w-5xl space-y-4 animate-fade-in my-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 self-stretch sm:self-auto">
                <button
                  onClick={() => setActiveVista('menu')}
                  className="p-2 border border-[#8B5A2B]/30 hover:bg-neutral-850 rounded-lg transition text-[#8B5A2B]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold font-mono tracking-wider text-white uppercase">Clientes Frecuentes</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Clientes registrados en tus envíos anteriores</p>
                </div>
              </div>

              {/* Dynamic search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={buscarCliente}
                  onChange={(e) => setBuscarCliente(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-xs sm:text-sm text-white inline-block outline-none font-mono"
                />
              </div>
            </div>

            {sugerenciasClientes.length === 0 ? (
              <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl p-12 text-center space-y-2 max-w-4xl mx-auto shadow-2xl">
                <div className="text-5xl">👥</div>
                <h3 className="text-md font-bold font-mono text-gray-300 uppercase tracking-wider">No se encontraron clientes</h3>
                <p className="text-xs text-gray-400">No hay clientes históricos bajo los filtros dados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {sugerenciasClientes.map((cliente) => (
                  <div
                    key={cliente.nombre}
                    className="bg-[#23170E]/50 border border-[#8B5A2B]/15 hover:border-[#8B5A2B]/40 rounded-2xl p-4 shadow-xl transition duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                          USR
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white uppercase truncate font-mono">{cliente.nombre}</h4>
                      </div>

                      <div className="space-y-1 font-mono text-xs text-gray-400 leading-relaxed">
                        <p className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="truncate">{cliente.direccion}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{cliente.telefono || 'Sin teléfono'}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Envíos previos: <strong className="text-white">{cliente.cantidadPedidos}</strong></span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEnviarACapturaCliente(cliente)}
                      className="w-full py-2 bg-[#8B5A2B]/20 hover:bg-[#8B5A2B] text-[#8B5A2B] hover:text-black font-bold font-mono text-[10px] sm:text-xs rounded-lg uppercase tracking-wider border border-[#8B5A2B]/25 transition duration-200"
                    >
                      ENVIAR NUEVO PEDIDO
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================== VIEW: CONSULTAS (70 DAYS) ===================== */}
        {activeVista === 'consulta' && usuarioActual && (
          <section className="w-full max-w-6xl space-y-4 animate-fade-in my-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 self-stretch md:self-auto">
                <button
                  onClick={() => setActiveVista('menu')}
                  className="p-2 border border-[#8B5A2B]/30 hover:bg-neutral-850 rounded-lg transition text-[#8B5A2B]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold font-mono tracking-wider text-white uppercase">Consulta de Envíos</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Pedidos y entregas de los últimos 70 días</p>
                </div>
              </div>

              {/* Advanced multi-filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchConsulta}
                    onChange={(e) => setSearchConsulta(e.target.value)}
                    placeholder="Rastrear guía o destinatario..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-xs outline-none font-mono text-white"
                  />
                </div>

                <select
                  value={filterStatusConsulta}
                  onChange={(e) => setFilterStatusConsulta(e.target.value)}
                  className="px-3 py-1.5 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-xs outline-none cursor-pointer text-gray-300 font-mono"
                >
                  <option value="">TODOS LOS ESTADOS</option>
                  <option value="EN RECOLECCION">EN RECOLECCIÓN</option>
                  <option value="EN RUTA">EN RUTA</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                  <option value="VISITADO">VISITADO</option>
                </select>
              </div>
            </div>

            {filteredConsulta.length === 0 ? (
              <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl p-12 text-center space-y-2 max-w-4xl mx-auto shadow-2xl">
                <div className="text-5xl">📅</div>
                <h3 className="text-md font-bold font-mono text-gray-300 uppercase tracking-wider">No se encontraron envíos</h3>
                <p className="text-xs text-gray-400">No se encontraron registros de entregas recientes para tus filtros en los últimos 70 días.</p>
              </div>
            ) : (
              <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                    <thead>
                      <tr className="bg-[#140D08]/90 border-b border-[#8B5A2B]/20 text-[#8B5A2B] uppercase tracking-wider font-bold">
                        <th className="px-4 py-3">Guía</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Destinatario</th>
                        <th className="px-4 py-3">Dirección</th>
                        <th className="px-4 py-3">Zona</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3">Cobro</th>
                        <th className="px-4 py-3">Fecha del Envío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8B5A2B]/10">
                      {filteredConsulta.map((pedido) => {
                        const est = String(pedido.ESTADO || '').trim().toUpperCase();
                        let statusColor = 'text-gray-400 bg-neutral-900 border-neutral-700';
                        if (est === 'ENTREGADO') statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20';
                        else if (est === 'EN RUTA') statusColor = 'text-sky-400 bg-sky-950/40 border-sky-500/20';
                        else if (est === 'EN RECOLECCION') statusColor = 'text-amber-500 bg-amber-950/40 border-amber-500/20';
                        else if (est === 'VISITADO') statusColor = 'text-rose-400 bg-rose-950/30 border-rose-500/20';

                        return (
                          <tr key={pedido.id} className="hover:bg-[#20150D]/30 transition">
                            <td className="px-4 py-3 text-white font-bold">{pedido.NGUIA || 'S/N'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {est}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white uppercase">{pedido.RECIBE || 'S/N'}</td>
                            <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">{pedido.DIRECCION || 'S/N'}</td>
                            <td className="px-4 py-3 text-amber-500 font-bold uppercase">{pedido.ZONA || 'SALTILLO'}</td>
                            <td className="px-4 py-3 text-gray-300">{pedido.TELEFONO || 'S/N'}</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">
                              ${Number(pedido.ACOBRAR || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-400">
                              {formatToDDMMAAAA(pedido["FECHA DE ENV"] || pedido["FECHA"])}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================== VIEW: MI PERFIL EDITOR ===================== */}
        {activeVista === 'perfil' && usuarioActual && (
          <section className="w-full max-w-2xl bg-[#23170E]/70 border border-[#8B5A2B]/20 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in my-4 relative">
            <button
              onClick={() => setActiveVista('menu')}
              className="absolute top-4 left-4 p-2 text-[#8B5A2B] hover:bg-neutral-800 rounded-lg transition shrink-0 hidden sm:flex items-center gap-2 text-xs font-mono font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> VOLVER
            </button>

            <div className="text-center space-y-1 pt-6 sm:pt-0">
              <div className="text-3xl">👤</div>
              <h2 className="text-md sm:text-lg font-bold text-white tracking-widest font-mono uppercase">EDITAR MI PERFIL</h2>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">{usuarioActual}</p>
            </div>

            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Contraseña de Seguridad *</label>
                <input
                  type="text"
                  value={perfilPass}
                  onChange={(e) => setPerfilPass(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white font-mono inline-block outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Nombre de Pila *</label>
                  <input
                    type="text"
                    value={perfilNombrePila}
                    onChange={(e) => setPerfilNombrePila(e.target.value.toUpperCase())}
                    placeholder="Nombre"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Teléfono de Enlace (10 dígitos) *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={perfilTelefono}
                    onChange={(e) => setPerfilTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Teléfono"
                    className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white font-mono inline-block outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Dirección de Despacho Registrada *</label>
                <input
                  type="text"
                  value={perfilDireccion}
                  onChange={(e) => setPerfilDireccion(e.target.value.toUpperCase())}
                  placeholder="Dirección fiscal"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B5A2B] block uppercase tracking-wider">Rubro o Nicho Registrado *</label>
                <input
                  type="text"
                  value={perfilRubro}
                  onChange={(e) => setPerfilRubro(e.target.value.toUpperCase())}
                  placeholder="Rubro de ventas"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/20 focus:border-[#8B5A2B] rounded-lg text-sm text-white inline-block outline-none uppercase"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveVista('menu')}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold font-mono transition uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleSavePerfil}
                  className="flex-1 py-3 bg-[#8B5A2B] hover:bg-[#6e4620] text-black font-bold font-mono text-xs rounded-lg transition uppercase"
                >
                  GUARDAR PERFIL
                </button>
              </div>

            </div>
          </section>
        )}

        {/* ===================== VIEW: REPORTE GENERAL ===================== */}
        {activeVista === 'reporte' && usuarioActual && (
          <section className="w-full max-w-4xl space-y-6 animate-fade-in">
            {/* Header section with back button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveVista('menu')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-200 hover:text-white rounded-lg text-xs font-bold font-mono tracking-wider transition uppercase cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Regresar al Menú
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wider font-mono uppercase">📊 Reporte General</h2>
                <p className="text-xs text-gray-400 mt-1">Histórico de tus reportes diarios ordenados de más recientes a antiguos.</p>
              </div>

              {/* Selector of days limit */}
              <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 p-3 rounded-xl flex items-center justify-between sm:justify-start gap-4">
                <span className="text-xs font-bold text-[#81552a] font-mono uppercase tracking-wider">Filtro de Días:</span>
                <select
                  value={limiteDiasReporte}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLimiteDiasReporte(val === 'TODO' ? 'TODO' : Number(val));
                  }}
                  className="px-3 py-1.5 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-xs font-mono text-white outline-none cursor-pointer uppercase"
                >
                  <option value="1">⚽ ÚLTIMO DÍA (1)</option>
                  <option value="10">📅 ÚLTIMOS 10 DÍAS</option>
                  <option value="30">📅 ÚLTIMOS 30 DÍAS</option>
                  <option value="50">📅 ÚLTIMOS 50 DÍAS</option>
                  <option value="TODO">⭐ TODO LO QUE TENGA</option>
                </select>
              </div>
            </div>

            {/* Render table block or fallback */}
            {reporteDiaLog.length === 0 ? (
              <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl p-12 text-center space-y-2 max-w-4xl mx-auto shadow-2xl">
                <div className="text-5xl">📊</div>
                <h3 className="text-md font-bold font-mono text-gray-300 uppercase tracking-wider">No se encontraron reportes</h3>
                <p className="text-xs text-gray-400">No hay registros cargados del Reporte General en la colección `REP_DIA` para tu cuenta (`{usuarioActual}`).</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary stat cards from the retrieved selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#18100A] border border-[#8B5A2B]/10 p-3 rounded-xl">
                    <p className="text-[9px] text-[#8B5A2B] uppercase tracking-widest font-mono">Total Pedidos</p>
                    <p className="text-base sm:text-lg font-bold text-white font-mono">
                      {reporteDiaLog.slice(0, limiteDiasReporte === 'TODO' ? reporteDiaLog.length : limiteDiasReporte).reduce((acc, curr) => acc + (Number(curr.R_PEDIDOS) || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-[#18100A] border border-[#8B5A2B]/10 p-3 rounded-xl">
                    <p className="text-[9px] text-emerald-400 uppercase tracking-widest font-mono">Días Mostrados</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                      {limiteDiasReporte === 'TODO' ? reporteDiaLog.length : Math.min(limiteDiasReporte, reporteDiaLog.length)}
                    </p>
                  </div>
                  <div className="bg-[#18100A] border border-[#8B5A2B]/10 p-3 rounded-xl">
                    <p className="text-[9px] text-sky-400 uppercase tracking-widest font-mono">Total Entregados</p>
                    <p className="text-base sm:text-lg font-bold text-sky-400 font-mono">
                      {reporteDiaLog.slice(0, limiteDiasReporte === 'TODO' ? reporteDiaLog.length : limiteDiasReporte).reduce((acc, curr) => acc + (Number(curr.R_ENTREGADOS) || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-[#18100A] border border-[#8B5A2B]/10 p-3 rounded-xl">
                    <p className="text-[9px] text-amber-500 uppercase tracking-widest font-mono">Dinero total</p>
                    <p className="text-base sm:text-lg font-bold text-amber-500 font-mono">
                      ${reporteDiaLog.slice(0, limiteDiasReporte === 'TODO' ? reporteDiaLog.length : limiteDiasReporte).reduce((acc, curr) => acc + (Number(curr.RD_ENTREGADO) || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="bg-[#23170E]/50 border border-[#8B5A2B]/20 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                      <thead>
                        <tr className="bg-[#140D08]/90 border-b border-[#8B5A2B]/20 text-[#8B5A2B] uppercase tracking-wider font-bold">
                          <th className="px-4 py-3">FECHA</th>
                          <th className="px-4 py-3 text-center">PEDIDOS</th>
                          <th className="px-4 py-3 text-center">RECOGIDOS</th>
                          <th className="px-4 py-3 text-center">SE ENTREGARON</th>
                          <th className="px-4 py-3 text-right">EN SOBRE</th>
                          <th className="px-4 py-3 text-right">DINERO ENTREGADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8B5A2B]/10">
                        {reporteDiaLog
                          .slice(0, limiteDiasReporte === 'TODO' ? reporteDiaLog.length : limiteDiasReporte)
                          .map((item, idx) => {
                            const dineroEntregado = Number(item.RD_ENTREGADO ?? 0);
                            const dineroQuedaEnSobre = Number(item.RD_EN_SOBRE ?? 0);

                            return (
                              <tr key={item.id || idx} className="hover:bg-[#20150D]/30 transition">
                                <td className="px-4 py-3 text-white font-bold">{item.R_FECHA || 'S/F'}</td>
                                <td className="px-4 py-3 text-center text-gray-300 font-bold">{item.R_PEDIDOS ?? 0}</td>
                                <td className="px-4 py-3 text-center text-amber-500 font-bold">{item.R_LLEGARON ?? 0}</td>
                                <td className="px-4 py-3 text-center text-emerald-400 font-bold">{item.R_ENTREGADOS ?? 0}</td>
                                <td className="px-4 py-3 text-right text-gray-300 font-bold">
                                  ${dineroQuedaEnSobre.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                                  ${dineroEntregado.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

      </main>

      {/* ===================== CUSTOM CONFIRM MODAL ===================== */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#23170E] border border-[#8B5A2B]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-md sm:text-lg font-bold font-mono tracking-wider text-[#8B5A2B] uppercase">{confirmModal.title}</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold font-mono tracking-wider transition text-gray-200 cursor-pointer uppercase"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => {
                  const onConf = confirmModal.onConfirm;
                  setConfirmModal(null);
                  onConf();
                }}
                className="flex-1 py-2 bg-rose-900 hover:bg-rose-800 text-white font-bold font-mono text-xs rounded-lg tracking-wider transition cursor-pointer uppercase"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CUSTOM PROMPT MODAL ===================== */}
      {promptModal && promptModal.show && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#23170E] border border-[#8B5A2B]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-md sm:text-lg font-bold font-mono tracking-wider text-[#8B5A2B] uppercase">{promptModal.title}</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">{promptModal.message}</p>
            </div>

            <div className="space-y-1">
              <input
                type="number"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={promptModal.placeholder}
                className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-sm text-white font-mono inline-block outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPromptModal(null)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold font-mono tracking-wider transition text-gray-200 cursor-pointer uppercase"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => {
                  const onConf = promptModal.onConfirm;
                  setPromptModal(null);
                  onConf(promptValue);
                }}
                className="flex-1 py-2 bg-[#8B5A2B] hover:bg-[#6e4620] text-black font-bold font-mono text-xs rounded-lg tracking-wider transition cursor-pointer uppercase"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== FRECUENTE CLIENT MODAL ===================== */}
      {frecuenteModal && frecuenteModal.show && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#23170E] border border-[#8B5A2B]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-md sm:text-lg font-bold font-mono tracking-wider text-[#8B5A2B] uppercase">📋 Enviar Nuevo Pedido</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                Para el cliente <strong className="text-white uppercase">{frecuenteModal.cliente.nombre}</strong>, ingresa los siguientes datos requeridos:
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8B5A2B] block uppercase tracking-wider">Contenido del Envío *</label>
                <input
                  type="text"
                  value={frecuenteContenido}
                  onChange={(e) => setFrecuenteContenido(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      frecuenteCobrarRef.current?.focus();
                    }
                  }}
                  placeholder="EJ: VESTIDO ROJO"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-xs sm:text-sm text-white inline-block outline-none uppercase font-mono"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8B5A2B] block uppercase tracking-wider">Cantidad a Cobrar ($) *</label>
                <input
                  type="number"
                  ref={frecuenteCobrarRef}
                  value={frecuenteCobrar}
                  onChange={(e) => setFrecuenteCobrar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (frecuenteContenido.trim() && frecuenteCobrar.trim() !== '') {
                        handleConfirmFrecuente();
                      } else {
                        showToast('Por favor completa todos los campos del envío.', 'error');
                      }
                    }
                  }}
                  placeholder="Escribe 0 si no se cobra nada"
                  className="w-full px-3 py-2 bg-[#18100A] border border-[#8B5A2B]/30 focus:border-[#8B5A2B] rounded-lg text-xs sm:text-sm text-white inline-block outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFrecuenteModal(null)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold font-mono tracking-wider transition text-gray-200 cursor-pointer uppercase"
              >
                CANCELAR
              </button>
              <button
                type="button"
                disabled={!frecuenteContenido.trim() || frecuenteCobrar.trim() === ''}
                onClick={handleConfirmFrecuente}
                className="flex-1 py-2 bg-[#8B5A2B] hover:bg-[#6e4620] disabled:bg-neutral-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold font-mono text-xs rounded-lg tracking-wider transition cursor-pointer uppercase"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== FOOTER CREDITS ===================== */}
      <footer className="py-4 border-t border-[#8B5A2B]/10 bg-[#140D08]/50 text-center font-mono text-[10px] text-gray-500">
        &copy; {new Date().getFullYear()} FICERT SAS. Todos los derechos reservados.
      </footer>

    </div>
  );
}
