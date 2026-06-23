import { useEffect, useMemo, useState } from 'react';

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

function App() {
  const [view, setView] = useState<'home' | 'login' | 'register' | 'profileForm' | 'profileResult'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => localStorage.getItem('authToken'), []);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProfile(storedToken);
    }
  }, []);

  async function api(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Error de servidor');
    }
    return data;
  }

  async function fetchProfile(authToken: string) {
    setLoading(true);
    try {
      const data = await api('/profile/me');
      setProfile(data.profile);
      if (data.profile) {
        setView('profileResult');
      } else {
        setView('profileForm');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      await fetchProfile(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(name: string, email: string, password: string, role: 'alumno' | 'docente', course: string) {
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
      setView(data.user.role === 'alumno' ? 'profileForm' : 'home');
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
    setView('home');
  }

  function renderHeader() {
    return (
      <header className="top-bar">
        <div>
          <strong>Aprendizaje Adaptativo</strong>
          <p>Perfil del momento, no etiqueta fija.</p>
        </div>
        {user ? (
          <div className="header-right">
            <span>{user.name} ({user.role})</span>
            <button className="ghost-button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        ) : null}
      </header>
    );
  }

  return (
    <div className="app-shell">
      {renderHeader()}
      <main>
        {loading && <div className="banner">Cargando...</div>}
        {error && <div className="banner error">{error}</div>}
        {!user && view === 'home' && (
          <section className="card welcome-card">
            <h1>Bienvenido/a</h1>
            <p>Registrate como alumno o docente para comenzar.</p>
            <div className="button-row">
              <button onClick={() => setView('login')}>Iniciar sesión</button>
              <button onClick={() => setView('register')}>Registrarme</button>
            </div>
          </section>
        )}

        {!user && view === 'login' && (
          <AuthForm onSubmit={handleLogin} mode="login" onBack={() => setView('home')} />
        )}

        {!user && view === 'register' && (
          <AuthForm onSubmit={handleRegister} mode="register" onBack={() => setView('home')} />
        )}

        {user && user.role === 'alumno' && !profile && view === 'profileForm' && (
          <ProfileForm onSaved={(profile) => { setProfile(profile); setView('profileResult'); }} />
        )}

        {user && user.role === 'alumno' && profile && view === 'profileResult' && (
          <ProfileResult profile={profile} onEdit={() => setView('profileForm')} />
        )}

        {user && user.role === 'docente' && (
          <section className="card">
            <h2>Modo docente</h2>
            <p>Por ahora, la app guarda perfiles de alumnos y muestra las dimensiones.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function AuthForm({ mode, onSubmit, onBack }: { mode: 'login' | 'register'; onSubmit: any; onBack: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'alumno' | 'docente'>('alumno');
  const [course, setCourse] = useState('');

  return (
    <section className="card form-card">
      <h2>{mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}</h2>
      <label>
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      </label>
      <label>
        Contraseña
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      </label>
      {mode === 'register' && (
        <>
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" />
          </label>
          <label>
            Soy
            <select value={role} onChange={(e) => setRole(e.target.value as 'alumno' | 'docente')}>
              <option value="alumno">Alumno/a</option>
              <option value="docente">Docente</option>
            </select>
          </label>
          {role === 'alumno' && (
            <label>
              Curso / división
              <input value={course} onChange={(e) => setCourse(e.target.value)} type="text" />
            </label>
          )}
        </>
      )}
      <div className="button-row">
        <button onClick={() => onSubmit(name, email, password, role, course)}>
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
        <button className="ghost-button" onClick={onBack} type="button">Volver</button>
      </div>
    </section>
  );
}

function ProfileForm({ onSaved }: { onSaved: (profile: Profile) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>(questions.reduce((acc, item) => ({ ...acc, [item.key]: 3 }), {}));
  const [formato, setFormato] = useState<string[]>([]);
  const [trabajo, setTrabajo] = useState('Solo/a');
  const [intereses, setIntereses] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No autorizado');
      }
      const response = await fetch(`${getApiBase()}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers, formato, trabajo, intereses }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Error al guardar el perfil');
      }
      onSaved(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <section className="card form-card">
      <h2>Perfil de aprendizaje</h2>
      <p>Contestá una sola vez. Tus respuestas se guardan y marcan tu perfil del momento.</p>
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
              onClick={() => {
                setFormato((prev) =>
                  prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
                );
              }}
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
            <button
              key={option}
              type="button"
              className={trabajo === option ? 'selected' : ''}
              onClick={() => setTrabajo(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <label>
        Intereses (opcional)
        <textarea value={intereses} onChange={(e) => setIntereses(e.target.value)} rows={3} />
      </label>
      {error && <div className="banner error">{error}</div>}
      <div className="button-row">
        <button onClick={handleSubmit}>Guardar perfil</button>
      </div>
    </section>
  );
}

function ProfileResult({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return (
    <section className="card profile-card">
      <h2>Tu perfil actual</h2>
      <p>El perfil es una foto del momento, no una etiqueta fija. Más adelante se puede ajustar con feedback real.</p>
      <div className="summary-box">
        <p><strong>Arquetipo:</strong> {profile.arquetipo}</p>
        <p>{profile.arquetipoDescripcion}</p>
        {profile.arquetipoSecundario ? <p><strong>Segundo posible arquetipo:</strong> {profile.arquetipoSecundario}</p> : null}
        <p><strong>Dimensiones más extremas:</strong> {profile.dimensionesDominantes.join(', ')}</p>
        <p><strong>Formato preferido:</strong> {profile.formato.join(', ') || 'Sin selección'}</p>
        <p><strong>Forma de trabajo:</strong> {profile.trabajo}</p>
        <p><strong>Intereses:</strong> {profile.intereses || 'No definidos'}</p>
      </div>
      <div className="bars">
        {Object.entries(profile.dims).map(([key, value]) => (
          <div className="bar-row" key={key}>
            <span>{key}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${((value - 1) / 4) * 100}%` }} />
            </div>
            <span>{value.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <button onClick={onEdit}>Actualizar perfil</button>
    </section>
  );
}

export default App;
