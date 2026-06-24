import { useEffect, useState } from 'react';
import Icon from './brand/Icon';
import { DiscereLogo } from './brand/Logo';
import DecoLayer from './brand/Deco';
import {
  tasks,
  classes,
  pathNodes,
  lesson,
  students as demoStudents,
  alerts,
  friction,
  masterySkills,
  activity,
  journeySteps,
  okCount,
  warnCount,
  riskCount,
  avgProg,
  type Student,
} from './data/demo';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'alumno' | 'docente';
  course?: string;
};

type Profile = {
  dims: Record<string, number>;
  arquetipo: string;
  arquetipoDescripcion: string;
  arquetipoSecundario?: string;
  dimensionesDominantes: string[];
  formato: string[];
  trabajo: string;
  intereses?: string;
};

type View =
  | 'welcome'
  | 'login'
  | 'register'
  | 'inicio'
  | 'senda'
  | 'leccion'
  | 'recompensa'
  | 'profileForm'
  | 'profileResult'
  | 'panel'
  | 'detalle';

const questions = [
  { key: 'q1', label: 'Cuando un tema me interesa, lo investigo más aunque no entre en el examen.' },
  { key: 'q2', label: 'Estudio sobre todo para aprobar y zafar.' },
  { key: 'q3', label: 'Necesito ver para qué sirve algo en la vida real para engancharme.' },
  { key: 'q4', label: 'Cuando algo me sale mal, pienso que puedo mejorar si practico más.' },
  { key: 'q5', label: 'Evito las tareas difíciles porque prefiero no equivocarme.' },
  { key: 'q6', label: 'Suelo organizar mi tiempo de estudio con anticipación.' },
  { key: 'q7', label: 'Me cuesta arrancar y dejo todo para último momento.' },
  { key: 'q8', label: 'Necesito que me marquen pasos claros para no perderme.' },
  { key: 'q9', label: 'Aprendo mejor cuando puedo discutir las ideas con otros.' },
  { key: 'q10', label: 'Me pongo muy nervioso/a antes de un examen importante.' },
  { key: 'q11', label: 'Soy capaz de aprender casi cualquier cosa si me lo propongo.' },
];

const formats = ['Video', 'Texto/apunte', 'Ejercicios', 'Ejemplos reales', 'Esquemas', 'Audio'];
const workModes = ['Solo/a', 'En grupo', 'Depende'];

function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
}

/* ---------- íconos en línea (estilo Discere) ---------- */
const Flame = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="#FF5E00">
    <path d="M12 2c2 3 1 5 0 6.2 1.1.2 2.2-.8 2.4-2.7 2.1 1.9 3.6 4.3 3.6 7.5a6 6 0 1 1-12 0c0-2.1 1-3.6 2.2-4.7-.1 1.4.6 2.4 1.6 2.6C12.4 8.5 11.4 5.4 12 2z" />
  </svg>
);
const Star = ({ s = 17, c = '#00A6ED' }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
    <path d="M12 2l2.9 6.1 6.6.7-5 4.5 1.4 6.5L12 17.1 6.1 20.3l1.4-6.5-5-4.5 6.6-.7z" />
  </svg>
);
const Heart = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="#E54B4B">
    <path d="M12 21s-7-4.4-9.4-8.3C.8 9.6 2.8 5.5 6.6 5.5c2.3 0 3.8 1.6 5.4 3.4 1.6-1.8 3.1-3.4 5.4-3.4 3.8 0 5.8 4.1 4 7.2C19 16.6 12 21 12 21z" />
  </svg>
);
const Check = ({ s = 15, c = '#00A6ED', w = 3.2 }: { s?: number; c?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Cross = ({ s = 12, c = '#fff', w = 3.5 }: { s?: number; c?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round" />
  </svg>
);
const Chevron = ({ c = '#ffd9c2' }: { c?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flex: 'none' }}>
    <path d="M9 6l6 6-6 6" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function firstNameOf(name: string) {
  return name.split(' ')[0] || name;
}

/* ============================================================
   App
   ============================================================ */
function App() {
  const [view, setView] = useState<View>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student>(demoStudents[0]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const u: User = JSON.parse(storedUser);
      setUser(u);
      if (u.role === 'docente') {
        setView('panel');
      } else {
        fetchProfile();
        setView('inicio');
      }
    }
  }, []);

  async function api(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    const token = localStorage.getItem('authToken');
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Error de servidor');
    return data;
  }

  async function fetchProfile() {
    try {
      const data = await api('/profile/me');
      setProfile(data.profile);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogin(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      if (data.user.role === 'docente') {
        setView('panel');
      } else {
        await fetchProfile();
        setView('inicio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(
    name: string,
    email: string,
    password: string,
    role: 'alumno' | 'docente',
    course: string,
  ) {
    setError(null);
    setLoading(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, course }),
      });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setView(data.user.role === 'docente' ? 'panel' : 'profileForm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    setError(null);
    setView('welcome');
  }

  /* ---------- sin sesión ---------- */
  if (!user) {
    if (view === 'login') {
      return <AuthForm mode="login" loading={loading} error={error} onSubmit={handleLogin} onBack={() => { setError(null); setView('welcome'); }} />;
    }
    if (view === 'register') {
      return <AuthForm mode="register" loading={loading} error={error} onSubmit={handleRegister} onBack={() => { setError(null); setView('welcome'); }} />;
    }
    return <Welcome onLogin={() => setView('login')} onRegister={() => setView('register')} />;
  }

  const isAlumno = user.role === 'alumno';

  function openStudent(s: Student) {
    setSelectedStudent(s);
    setView('detalle');
  }

  return (
    <div className="screen-wrap">
      {error && <div className="toast error">{error}</div>}

      {isAlumno && view === 'inicio' && (
        <Inicio user={user} profile={profile} onNav={setView} onOpenClass={() => setView('senda')} />
      )}
      {isAlumno && view === 'senda' && (
        <Senda onNav={setView} onStart={() => setView('leccion')} onLogout={handleLogout} />
      )}
      {isAlumno && view === 'leccion' && (
        <Leccion onNav={setView} onComplete={() => setView('recompensa')} onExit={() => setView('senda')} />
      )}
      {isAlumno && view === 'recompensa' && <Recompensa onContinue={() => setView('senda')} />}
      {isAlumno && view === 'profileForm' && (
        <ProfileShell user={user} active="Perfil" onNav={setView} onLogout={handleLogout}>
          <ProfileForm onSaved={(p) => { setProfile(p); setView('profileResult'); }} />
        </ProfileShell>
      )}
      {isAlumno && view === 'profileResult' && (
        <ProfileShell user={user} active="Perfil" onNav={setView} onLogout={handleLogout}>
          {profile ? (
            <ProfileResult profile={profile} onEdit={() => setView('profileForm')} />
          ) : (
            <EmptyProfile onStart={() => setView('profileForm')} />
          )}
        </ProfileShell>
      )}

      {!isAlumno && view === 'panel' && (
        <Panel user={user} onNav={setView} onOpenStudent={openStudent} onLogout={handleLogout} />
      )}
      {!isAlumno && view === 'detalle' && (
        <Detalle student={selectedStudent} onBack={() => setView('panel')} onNav={setView} onLogout={handleLogout} />
      )}
    </div>
  );
}

/* ============================================================
   Top navigation (web)
   ============================================================ */
function TopNav({
  items,
  active,
  onSelect,
  right,
  compact,
}: {
  items: string[];
  active: string;
  onSelect: (item: string) => void;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="topnav">
      <nav className="topnav-links">
        {items.map((it) => (
          <button
            key={it}
            className={`topnav-link ${it === active ? 'active' : ''}`}
            onClick={() => onSelect(it)}
          >
            {it}
          </button>
        ))}
      </nav>
      {right}
      <DiscereLogo size={compact ? 28 : 30} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <div className="chip">{children}</div>;
}

/* ============================================================
   Bienvenida
   ============================================================ */
function Welcome({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <DiscereLogo size={30} wordmark />
        </div>
        <h1>Aprendé a tu manera.</h1>
        <p className="lead">
          Una senda gamificada que se adapta a cómo aprendés. Tu perfil es una foto del momento, no una etiqueta fija.
        </p>
        <div className="row" style={{ marginBottom: 22, gap: 12, flexWrap: 'wrap' }}>
          <div className="stat-pill"><Flame /> Racha diaria</div>
          <div className="stat-pill"><Star /> XP &amp; insignias</div>
        </div>
        <div className="btn-row">
          <button className="btn block" onClick={onRegister}>Crear cuenta</button>
          <button className="btn ghost block" onClick={onLogin}>Ya tengo cuenta</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Login / Registro
   ============================================================ */
function AuthForm({
  mode,
  loading,
  error,
  onSubmit,
  onBack,
}: {
  mode: 'login' | 'register';
  loading: boolean;
  error: string | null;
  onSubmit: any;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'alumno' | 'docente'>('alumno');
  const [course, setCourse] = useState('');

  function submit() {
    if (mode === 'login') onSubmit(email, password);
    else onSubmit(name, email, password, role, course);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand"><DiscereLogo size={30} wordmark /></div>
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="lead">
          {mode === 'login' ? 'Volvé a tu senda y mantené tu racha.' : 'Registrate como alumno o docente para empezar.'}
        </p>

        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="vos@correo.com" />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </label>

        {mode === 'register' && (
          <>
            <label className="field">
              <span>Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Tu nombre" />
            </label>
            <label className="field">
              <span>Soy</span>
              <select value={role} onChange={(e) => setRole(e.target.value as 'alumno' | 'docente')}>
                <option value="alumno">Alumno/a</option>
                <option value="docente">Docente</option>
              </select>
            </label>
            {role === 'alumno' && (
              <label className="field">
                <span>Curso / división</span>
                <input value={course} onChange={(e) => setCourse(e.target.value)} type="text" placeholder="3°B" />
              </label>
            )}
          </>
        )}

        {error && <div className="banner error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="btn-row">
          <button className="btn block" onClick={submit} disabled={loading}>
            {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
          <button className="btn ghost block" onClick={onBack} type="button">Volver</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   01 · Inicio — alumno
   ============================================================ */
function Inicio({
  user,
  profile,
  onNav,
  onOpenClass,
}: {
  user: User;
  profile: Profile | null;
  onNav: (v: View) => void;
  onOpenClass: () => void;
}) {
  void profile;
  const handleNav = (item: string) => {
    onNav(item === 'Perfil' ? 'profileResult' : 'inicio');
  };
  return (
    <div className="screen" data-set="inicio">
      <DecoLayer set="inicio" />
      <div className="screen-inner">
        <TopNav
          items={['Inicio', 'Liga', 'Insignias', 'Perfil']}
          active="Inicio"
          onSelect={handleNav}
          right={
            <>
              <Chip><Flame /> <span>7</span></Chip>
              <Chip><Star /> <span>1 240</span></Chip>
            </>
          }
        />

        <div style={{ paddingTop: 14 }}>
          <div className="headline">Hola, {firstNameOf(user.name)}</div>
          <div className="headline-sub">Esto es lo que tenés para hoy.</div>
        </div>

        <div className="inicio-cols">
          {/* avatar */}
          <div className="inicio-avatar">
            <div className="avatar-stage">
              <div className="avatar-shadow" />
              <img src="/brand/avatars/a3.png" alt="Tu avatar" className="avatar-img" />
            </div>
            <div className="avatar-tags">
              <span className="tag blue">Nivel 5</span>
              <span className="tag orange">Liga Oro</span>
              <span className="tag cream">88% precisión</span>
            </div>
          </div>

          {/* tareas */}
          <div className="inicio-tasks">
            <div className="col-title">Tareas Pendientes</div>
            <div className="task-list">
              {tasks.map((t) => (
                <div className="task-row" key={t.name}>
                  <div className="grow">
                    <div className="task-name">{t.name}</div>
                    <div className="task-meta">{t.meta}</div>
                  </div>
                  <Chevron />
                </div>
              ))}
            </div>
            <div className="ai-hint">
              <div className="ai-orb bob"><Icon name="Group4" width={30} height={20} /></div>
              <div className="ai-hint-text">
                Empecemos por <b>Fracciones</b> — detecté que es lo que más te cuesta.
              </div>
            </div>
          </div>

          {/* clases */}
          <div className="inicio-classes">
            <div className="col-title">Mis Clases</div>
            <div className="class-list">
              {classes.map((c) => (
                <button
                  key={c.name}
                  className="class-row"
                  onClick={c.active ? onOpenClass : undefined}
                  style={{ cursor: c.active ? 'pointer' : 'default' }}
                >
                  <span className="class-name">{c.name}</span>
                  {c.active && <span className="class-badge">En curso</span>}
                  <span className="class-prog">{c.prog}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   02 · Senda de la clase — alumno
   ============================================================ */
function Senda({
  onNav,
  onStart,
  onLogout,
}: {
  onNav: (v: View) => void;
  onStart: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="screen" data-set="senda">
      <DecoLayer set="senda" />
      <div className="screen-inner senda-grid">
        <div className="senda-main">
          <TopNav
            items={['Inicio', 'Liga', 'Insignias', 'Perfil']}
            active="Inicio"
            onSelect={(it) => onNav(it === 'Perfil' ? 'profileResult' : 'inicio')}
            right={<Chip><Flame /> <span>7</span></Chip>}
            compact
          />

          <div className="eyebrow">Unidad 2</div>
          <div className="headline mid">Matemática</div>
          <div className="headline-sub">Ecuaciones lineales · senda calibrada por la IA</div>

          <div className="path-area">
            <svg width="620" height="520" viewBox="0 0 620 520" fill="none" className="path-svg">
              <path d="M150 50 C100 92 90 110 90 156 C90 206 270 214 270 260 C270 308 96 318 96 366" stroke="#00A6ED" strokeWidth="9" strokeLinecap="round" />
              <path d="M96 366 C96 416 286 424 286 466" stroke="#dcd3bd" strokeWidth="9" strokeLinecap="round" strokeDasharray="2 20" />
            </svg>
            {pathNodes.map((node) => {
              if (node.state === 'current') {
                return (
                  <div key={node.n} style={{ position: 'absolute', left: node.left, top: node.top, width: 92, height: 92 }}>
                    <div className="node-pulse" />
                    <div className="node-tip">EMPEZAR<span className="node-tip-arrow" /></div>
                    <button className="node node-current" onClick={onStart}>{node.n}</button>
                  </div>
                );
              }
              const cls = node.state === 'done' ? 'node-done' : 'node-locked';
              return (
                <div key={node.n} style={{ position: 'absolute', left: node.left, top: node.top, width: 76, height: 76 }}>
                  <div className={`node ${cls}`}>{node.n}</div>
                  {node.state === 'done' && (
                    <div className="node-check"><Check /></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* right rail */}
        <aside className="senda-rail">
          <div className="rail-card">
            <div className="rail-title">Meta diaria</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
              <div className="ring" style={{ background: 'conic-gradient(#FF5E00 75%, #f0e7d2 0)' }}>
                <div className="ring-hole" style={{ color: '#FF5E00' }}>75%</div>
              </div>
              <div>
                <div className="rail-strong">30 / 40 XP</div>
                <div className="rail-muted">Te faltan 10 XP hoy</div>
              </div>
            </div>
          </div>

          <div className="rail-card navy">
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="ai-orb bob"><Icon name="Group4" width={32} height={22} /></div>
              <div className="rail-ai-title">Tu compañero IA</div>
            </div>
            <div className="rail-ai-body">
              Reforcé esta senda con <b>fracciones</b> antes del próximo desafío. Vas muy bien — seguí así.
            </div>
          </div>

          <div className="rail-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rail-title">Liga Oro</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#FF5E00' }}>Puesto 3</span>
            </div>
            <div className="league-bars">
              <i className="on" /><i className="on" /><i className="on" /><i /><i />
            </div>
            <div className="rail-muted" style={{ marginTop: 9 }}>Ascendés a Platino con 40 XP más</div>
          </div>

          <button className="btn ghost block" style={{ marginTop: 'auto' }} onClick={onLogout}>Cerrar sesión</button>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   03 · Lección · feedback de IA — alumno
   ============================================================ */
function Leccion({
  onComplete,
  onExit,
}: {
  onNav: (v: View) => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hearts, setHearts] = useState(4);

  const correctIdx = lesson.options.findIndex((o) => o.state === 'correct');
  const isCorrect = checked && selected === correctIdx;
  const isWrong = checked && selected !== null && selected !== correctIdx;

  function tileClass(i: number) {
    if (!checked) return selected === i ? 'tile selected' : 'tile';
    if (i === correctIdx) return 'tile correct';
    if (i === selected) return 'tile wrong';
    return 'tile';
  }

  function check() {
    if (selected === null) return;
    setChecked(true);
    if (selected !== correctIdx) setHearts((h) => Math.max(0, h - 1));
  }

  function retry() {
    setChecked(false);
    setSelected(null);
  }

  return (
    <div className="screen" data-set="leccion">
      <DecoLayer set="leccion" />
      <div className="screen-inner leccion-flow">
        {/* top */}
        <div className="leccion-top">
          <button className="icon-btn" onClick={onExit} aria-label="Salir">
            <Cross s={26} c="#c2b89f" w={3} />
          </button>
          <div className="progress-track"><div className="progress-fill" style={{ width: '62%' }} /></div>
          <div className="hearts"><Heart /> <span>{hearts}</span></div>
          <DiscereLogo size={28} />
        </div>

        {/* center */}
        <div className="leccion-center">
          <div className="leccion-q">
            <div className="leccion-eyebrow">{lesson.prompt}</div>
            <div className="equation-card">{lesson.equation}</div>
            <div className="tiles">
              {lesson.options.map((o, i) => (
                <button
                  key={o.label}
                  className={tileClass(i)}
                  onClick={() => !checked && setSelected(i)}
                  disabled={checked}
                >
                  {o.label}
                  {checked && i === correctIdx && <span className="tile-badge ok"><Check s={14} c="#fff" w={3.5} /></span>}
                  {checked && i === selected && i !== correctIdx && <span className="tile-badge bad"><Cross /></span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* feedback */}
        {!checked && (
          <div className="leccion-foot idle">
            <div className="foot-inner">
              <div style={{ flex: 1 }} />
              <button className="btn blue" disabled={selected === null} onClick={check}>COMPROBAR</button>
            </div>
          </div>
        )}
        {isCorrect && (
          <div className="leccion-foot good">
            <div className="foot-inner">
              <div className="fb-orb"><Icon name="Group4" width={34} height={24} /></div>
              <div style={{ flex: 1 }}>
                <div className="fb-title ok">¡Excelente! Despejaste bien</div>
                <div className="fb-body">Restaste 6 de los dos lados y dividiste por 2: <b>14 − 6 = 8</b>, y <b>8 ÷ 2 = 4</b>.</div>
              </div>
              <button className="btn" onClick={onComplete}>CONTINUAR</button>
            </div>
          </div>
        )}
        {isWrong && (
          <div className="leccion-foot bad">
            <div className="foot-inner">
              <div className="fb-orb"><Icon name="Group4" width={34} height={24} /></div>
              <div style={{ flex: 1 }}>
                <div className="fb-title">{lesson.feedbackTitle}</div>
                <div className="fb-body">{lesson.feedbackBody}</div>
              </div>
              <button className="btn red" onClick={retry}>REINTENTAR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   04 · Recompensa · XP + racha — alumno
   ============================================================ */
function Recompensa({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="screen" data-set="recompensa">
      <DecoLayer set="recompensa" />
      <div className="confetti" aria-hidden>
        <i style={{ left: 300, top: 90, background: '#00A6ED', borderRadius: 3, transform: 'rotate(20deg)' }} />
        <i style={{ left: 500, top: 60, background: '#FF5E00', borderRadius: '50%' }} />
        <i style={{ left: 820, top: 80, background: '#F5E0B7', borderRadius: 3, transform: 'rotate(-15deg)' }} />
        <i style={{ left: 980, top: 120, background: '#FF5E00', borderRadius: 2, transform: 'rotate(30deg)' }} />
        <i style={{ left: 640, top: 50, background: '#00A6ED', borderRadius: '50%' }} />
      </div>
      <div className="screen-inner">
        <div className="topnav">
          <div style={{ flex: 1 }} />
          <DiscereLogo size={30} />
        </div>

        <div className="reward-center">
          <div className="trophy bob"><img src="/brand/deco/trophy.png" alt="Trofeo" /></div>
          <div className="headline mid center">¡Lección completada!</div>
          <div className="headline-sub center">Ecuaciones lineales · Unidad 2</div>

          <div className="reward-stats">
            <div className="reward-stat blue">
              <Star s={26} c="#fff" />
              <div className="rs-value">+30</div>
              <div className="rs-label">XP ganada</div>
            </div>
            <div className="reward-stat orange">
              <Flame s={26} />
              <div className="rs-value">8</div>
              <div className="rs-label">Días de racha</div>
            </div>
            <div className="reward-stat cream">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#2E4756" strokeWidth="2.2" />
                <circle cx="12" cy="12" r="4.5" stroke="#2E4756" strokeWidth="2.2" />
                <circle cx="12" cy="12" r="1.4" fill="#2E4756" />
              </svg>
              <div className="rs-value" style={{ color: '#2E4756' }}>90%</div>
              <div className="rs-label" style={{ color: '#7c7156' }}>Precisión</div>
            </div>
          </div>

          <div className="reward-level">
            <div className="rl-head"><span style={{ color: '#0A0A0A' }}>Nivel 5</span><span style={{ color: '#8a8273' }}>Nivel 6</span></div>
            <div className="rl-track"><div className="rl-fill" style={{ width: '74%' }} /></div>
            <div className="rl-foot">740 / 1000 XP · faltan 260 para subir</div>
          </div>

          <button className="btn block" style={{ maxWidth: 580, marginTop: 18 }} onClick={onContinue}>CONTINUAR</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   05 · Panel docente
   ============================================================ */
function Panel({
  onNav,
  onOpenStudent,
  onLogout,
}: {
  user: User;
  onNav: (v: View) => void;
  onOpenStudent: (s: Student) => void;
  onLogout: () => void;
}) {
  return (
    <div className="screen" data-set="panel">
      <DecoLayer set="panel" />
      <div className="screen-inner" style={{ padding: '26px 40px 40px' }}>
        <TopNav
          items={['Panel', 'Alumnos', 'Contenido', 'Informes']}
          active="Panel"
          onSelect={(it) => (it === 'Panel' ? onNav('panel') : undefined)}
          right={
            <>
              <div className="search-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#b3ab95" strokeWidth="2.2" /><path d="M20 20l-3.5-3.5" stroke="#b3ab95" strokeWidth="2.2" strokeLinecap="round" /></svg>
                Buscar alumno
              </div>
              <button className="btn ghost" style={{ padding: '8px 16px' }} onClick={onLogout}>Salir</button>
            </>
          }
        />

        <div className="eyebrow" style={{ marginTop: 18 }}>3°B · Matemática</div>
        <div className="headline small">Tu clase, de un vistazo</div>

        <div className="kpi-row">
          <div className="kpi-card"><div className="kpi-label">Alumnos activos</div><div className="kpi-value">28<span>/30</span></div></div>
          <div className="kpi-card"><div className="kpi-label">Progreso promedio</div><div className="kpi-value" style={{ color: '#00A6ED' }}>{avgProg}%</div></div>
          <div className="kpi-card"><div className="kpi-label">Necesitan ayuda</div><div className="kpi-value" style={{ color: '#E54B4B' }}>{riskCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Racha de la clase</div><div className="kpi-value" style={{ color: '#FF5E00' }}>12 <span>días</span></div></div>
        </div>

        <div className="alerts-card">
          <div className="alerts-head">
            <div className="ai-orb sm"><Icon name="Group4" width={22} height={16} /></div>
            <span>La IA detectó alumnos que necesitan ayuda</span>
          </div>
          <div className="alerts-row">
            {alerts.map((a) => {
              const s = demoStudents.find((x) => x.id === a.id)!;
              return (
                <div className="alert-card" key={a.id}>
                  <div className="alert-av"><img src={a.av} alt="" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span className="dot" style={{ background: a.dot }} />
                      <span className="alert-name">{a.name}</span>
                    </div>
                    <div className="alert-reason">{a.reason}</div>
                  </div>
                  <button className="alert-btn" onClick={() => onOpenStudent(s)}>Ver</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="students-head">
          <span className="students-title">Mis alumnos (30)</span>
          <div style={{ flex: 1 }} />
          <div className="legend">
            <span><span className="dot" style={{ background: '#3FB97A' }} />{okCount} al día</span>
            <span><span className="dot" style={{ background: '#F4B53F' }} />{warnCount} a observar</span>
            <span><span className="dot" style={{ background: '#E54B4B' }} />{riskCount} en riesgo</span>
          </div>
        </div>

        <div className="students-grid">
          {demoStudents.map((s) => (
            <button className="student-card" key={s.id} onClick={() => onOpenStudent(s)}>
              <span className="student-dot" style={{ background: s.dot }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div className="student-av"><img src={s.av} alt="" /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="student-name">{s.name}</div>
                  <div className="student-unit">{s.unit}</div>
                </div>
              </div>
              <div className="student-track"><div className="student-fill" style={{ width: s.barWidth }} /></div>
              <div className="student-foot"><span>Progreso</span><span className="student-pct">{s.prog}%</span></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   06 · Detalle de alumno — docente
   ============================================================ */
function Detalle({
  student,
  onBack,
  onNav,
  onLogout,
}: {
  student: Student;
  onBack: () => void;
  onNav: (v: View) => void;
  onLogout: () => void;
}) {
  return (
    <div className="screen" data-set="detalle">
      <DecoLayer set="detalle" />
      <div className="screen-inner" style={{ padding: '26px 40px 40px' }}>
        <TopNav
          items={['Panel', 'Alumnos', 'Contenido', 'Informes']}
          active="Alumnos"
          onSelect={(it) => (it === 'Panel' ? onNav('panel') : undefined)}
          right={<button className="btn ghost" style={{ padding: '8px 16px' }} onClick={onLogout}>Salir</button>}
        />

        <div className="breadcrumb">
          <button className="crumb-link" onClick={onBack}>Alumnos</button> / <span className="crumb-current">{student.name}</span>
        </div>

        <div className="detail-header">
          <div className="detail-av"><img src={student.av} alt="" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="detail-name">{student.name}</span>
              <span className="tag blue">Nivel 5</span>
              <span className="tag orange">Liga Oro</span>
            </div>
            <div className="detail-sub">Activo hace 12 min · 3°B Matemática</div>
          </div>
          <div className="detail-stats">
            <div><div className="ds-value" style={{ color: '#FF5E00' }}>8</div><div className="ds-label">Racha</div></div>
            <div><div className="ds-value" style={{ color: '#00A6ED' }}>1 240</div><div className="ds-label">XP</div></div>
            <div><div className="ds-value" style={{ color: '#E54B4B' }}>{100 - student.prog}%</div><div className="ds-label">Precisión</div></div>
            <div><div className="ds-value" style={{ color: '#0A0A0A' }}>{student.prog}%</div><div className="ds-label">Unidad 2</div></div>
          </div>
        </div>

        <div className="detail-cols">
          {/* left */}
          <div className="detail-left">
            <div className="panel-box">
              <div className="box-title">Recorrido de aprendizaje</div>
              <div className="box-sub">Unidad 2 · Ecuaciones lineales</div>
              <div className="journey">
                {journeySteps.map((step, i) => (
                  <Step key={step.name} step={step} last={i === journeySteps.length - 1} nextStuck={journeySteps[i + 1]?.state} />
                ))}
              </div>
            </div>

            <div className="panel-box">
              <div className="box-title" style={{ marginBottom: 6 }}>Actividad reciente</div>
              {activity.map((ev) => (
                <div className="activity-row" key={ev.txt}>
                  <span className="dot" style={{ background: ev.col, marginTop: 4 }} />
                  <div style={{ flex: 1 }}><div className="activity-txt">{ev.txt}</div></div>
                  <div className="activity-time">{ev.t}</div>
                </div>
              ))}
            </div>
          </div>

          {/* right */}
          <div className="detail-right">
            <div className="panel-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="Group13" width={22} height={12} style={{ color: '#E54B4B' }} />
                <span className="box-title">Puntos de fricción (IA)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
                {friction.map((f) => (
                  <div key={f.skill} className="friction" style={{ background: f.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="friction-skill">{f.skill}</span>
                      <span style={{ fontWeight: 700, fontSize: 10, color: f.col }}>{f.errors}</span>
                    </div>
                    <div className="friction-detail">{f.detail}</div>
                    <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '.04em', color: f.col, marginTop: 6 }}>{f.sev}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rail-card navy">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ai-orb"><Icon name="Group4" width={26} height={18} /></div>
                <span className="rail-ai-title">Recomendación de la IA</span>
              </div>
              <div className="rail-ai-body">
                Asigná a {firstNameOf(student.name)} <b>2 micro-ejercicios de despeje guiado</b> antes de avanzar. Suele resolver el lado izquierdo y olvidar replicarlo en el derecho.
              </div>
              <button className="btn block" style={{ marginTop: 14 }}>Asignar refuerzo</button>
            </div>

            <div className="panel-box">
              <div className="box-title" style={{ marginBottom: 12 }}>Dominio por habilidad</div>
              {masterySkills.map((sk) => (
                <div key={sk.name} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span className="mastery-name">{sk.name}</span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: sk.col }}>{sk.label}</span>
                  </div>
                  <div className="mastery-track"><div className="mastery-fill" style={{ width: sk.pct, background: sk.col }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  step,
  last,
  nextStuck,
}: {
  step: { name: string; state: 'done' | 'stuck' | 'locked' };
  last: boolean;
  nextStuck?: 'done' | 'stuck' | 'locked';
}) {
  const connectorColor = step.state === 'done' ? (nextStuck === 'stuck' ? '#E54B4B' : '#00A6ED') : '#e6dcc4';
  return (
    <>
      <div className="step">
        <div className={`step-circle ${step.state}`}>
          {step.state === 'done' && <Check s={22} c="#fff" w={3} />}
          {step.state === 'stuck' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5v.5" stroke="#E54B4B" strokeWidth="2.6" strokeLinecap="round" /><path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="#E54B4B" strokeWidth="2" /></svg>
          )}
          {step.state === 'locked' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 11V8a6 6 0 0 1 12 0v3" stroke="#b3ab95" strokeWidth="2.4" strokeLinecap="round" /><rect x="4.5" y="11" width="15" height="9" rx="2.5" fill="#b3ab95" /></svg>
          )}
        </div>
        <div className={`step-name ${step.state}`}>{step.name}</div>
      </div>
      {!last && <div className="step-connector" style={{ background: connectorColor }} />}
    </>
  );
}

/* ============================================================
   Perfil — shell + formulario + resultado
   ============================================================ */
function ProfileShell({
  user,
  active,
  onNav,
  onLogout,
  children,
}: {
  user: User;
  active: string;
  onNav: (v: View) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  void user;
  return (
    <div className="screen" data-set="inicio">
      <div className="screen-inner">
        <TopNav
          items={['Inicio', 'Liga', 'Insignias', 'Perfil']}
          active={active}
          onSelect={(it) => {
            if (it === 'Inicio') onNav('inicio');
            else if (it === 'Perfil') onNav('profileResult');
          }}
          right={<button className="btn ghost" style={{ padding: '8px 16px' }} onClick={onLogout}>Salir</button>}
        />
        <div className="profile-body">{children}</div>
      </div>
    </div>
  );
}

function EmptyProfile({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div className="headline small">Tu perfil de aprendizaje</div>
      <div className="headline-sub">Todavía no completaste tu cuestionario inicial.</div>
      <div className="card mt-22" style={{ maxWidth: 620 }}>
        <p style={{ fontWeight: 600, color: '#5a5346', lineHeight: 1.5, fontSize: 15, margin: 0 }}>
          Respondé una sola vez para que la plataforma calibre tu senda según cómo aprendés.
        </p>
        <div className="btn-row"><button className="btn" onClick={onStart}>Empezar cuestionario</button></div>
      </div>
    </>
  );
}

function ProfileForm({ onSaved }: { onSaved: (profile: Profile) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>(
    questions.reduce((acc, item) => ({ ...acc, [item.key]: 3 }), {}),
  );
  const [formato, setFormato] = useState<string[]>([]);
  const [trabajo, setTrabajo] = useState('Solo/a');
  const [intereses, setIntereses] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autorizado');
      const response = await fetch(`${getApiBase()}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers, formato, trabajo, intereses }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Error al guardar el perfil');
      onSaved(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="headline small">Perfil de aprendizaje</div>
      <div className="headline-sub">Contestá una sola vez. Tus respuestas marcan tu perfil del momento.</div>

      <div className="card mt-22" style={{ maxWidth: 720 }}>
        <div className="field-label">¿Qué tan de acuerdo estás? (1 = nada · 5 = mucho)</div>
        {questions.map((question) => (
          <div className="question" key={question.key}>
            <label>{question.label}</label>
            <div className="scale-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={answers[question.key] === value ? 'selected' : ''}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="question">
          <label>Formato preferido</label>
          <div className="tags-row">
            {formats.map((option) => (
              <button
                key={option}
                type="button"
                className={formato.includes(option) ? 'selected' : ''}
                onClick={() =>
                  setFormato((prev) => (prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option]))
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="question">
          <label>Forma de trabajo</label>
          <div className="tags-row">
            {workModes.map((option) => (
              <button key={option} type="button" className={trabajo === option ? 'selected' : ''} onClick={() => setTrabajo(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Intereses (opcional)</span>
          <textarea value={intereses} onChange={(e) => setIntereses(e.target.value)} rows={3} placeholder="Música, fútbol, programación…" />
        </label>

        {error && <div className="banner error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="btn-row">
          <button className="btn" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar perfil'}</button>
        </div>
      </div>
    </>
  );
}

function ProfileResult({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return (
    <>
      <div className="headline small">Tu perfil actual</div>
      <div className="headline-sub">Es una foto del momento; se ajusta con feedback real más adelante.</div>

      <div className="row mt-22" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 22 }}>
        <div className="card" style={{ flex: '1 1 360px', minWidth: 300 }}>
          <h2 className="card-title">Resumen</h2>
          <div className="summary-box mt-16">
            <p><strong>Arquetipo:</strong> {profile.arquetipo}</p>
            <p>{profile.arquetipoDescripcion}</p>
            {profile.arquetipoSecundario && <p><strong>Segundo posible arquetipo:</strong> {profile.arquetipoSecundario}</p>}
            <p><strong>Dimensiones más extremas:</strong> {profile.dimensionesDominantes.join(', ')}</p>
            <p><strong>Formato preferido:</strong> {profile.formato.join(', ') || 'Sin selección'}</p>
            <p><strong>Forma de trabajo:</strong> {profile.trabajo}</p>
            <p><strong>Intereses:</strong> {profile.intereses || 'No definidos'}</p>
          </div>
          <div className="btn-row"><button className="btn blue" onClick={onEdit}>Actualizar perfil</button></div>
        </div>

        <div className="card" style={{ flex: '1 1 360px', minWidth: 300 }}>
          <h2 className="card-title">Tus dimensiones</h2>
          <p className="card-sub">Escala de 1 a 5 según tus respuestas.</p>
          <div className="bars mt-16">
            {Object.entries(profile.dims).map(([key, value]) => (
              <div className="bar-row" key={key}>
                <span>{key}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${((value - 1) / 4) * 100}%` }} /></div>
                <span>{value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
