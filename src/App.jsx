import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Bot,
  Box,
  Camera,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Database,
  FileText,
  HelpCircle,
  Home,
  Image as ImageIcon,
  ListOrdered,
  Layers3,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  PackageCheck,
  Phone,
  Printer,
  RefreshCcw,
  Ruler,
  Rotate3D,
  ScanLine,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wand2,
  X,
} from "lucide-react";

const SERVICES = [
  {
    id: "print",
    title: "3D печать",
    short: "Печать",
    subtitle: "Пластик, смола, прототипы",
    description: "Подберем материал, оценим срок и подготовим модель к печати.",
    price: "от 900 ₽",
    icon: Printer,
  },
  {
    id: "scan",
    title: "3D скан",
    short: "Скан",
    subtitle: "Оцифровка детали или объекта",
    description: "Снимем геометрию объекта и подготовим облако точек или сетку.",
    price: "от 2 500 ₽",
    icon: ScanLine,
  },
  {
    id: "model",
    title: "3D моделирование",
    short: "Модель",
    subtitle: "CAD, STL, доработка",
    description: "Соберем модель по фото, эскизу, чертежу или техническому заданию.",
    price: "от 3 000 ₽",
    icon: Box,
  },
  {
    id: "reverse",
    title: "Реверс-инжиниринг",
    short: "Реверс",
    subtitle: "Скан + CAD + проверка",
    description: "Восстановим CAD-модель по детали и подготовим документацию.",
    price: "от 8 000 ₽",
    icon: Wand2,
  },
];

const EXAMPLES = [
  "Напечатать корпус 120 мм из PLA, нужна аккуратная поверхность",
  "Отсканировать деталь и сделать CAD-модель",
  "По фото сделать 3D-модель для печати",
  "Проверить STL перед печатью",
];

const MATERIALS = ["PLA", "PETG", "ABS", "Фотополимер", "Не знаю"];
const DEADLINES = ["Срочно", "3-5 дней", "1-2 недели", "Не горит"];
const ORDER_STATUSES = ["Новая", "На уточнении", "На оценке", "Согласование", "В работе", "Готово", "Выдано", "Отменено"];

const MATERIAL_MULTIPLIERS = { PLA: 1, PETG: 1.15, ABS: 1.25, Фотополимер: 1.8, "Не знаю": 1.1 };
const DEADLINE_MULTIPLIERS = { Срочно: 1.6, "3-5 дней": 1.2, "1-2 недели": 1, "Не горит": 0.95 };

const HELP_ITEMS = [
  ["Какие файлы можно отправить?", "STL, OBJ, STEP, 3MF, фото, эскиз, PDF или обычное описание задачи."],
  ["Как быстро получить оценку?", "Укажите размеры, материал, назначение детали, срок и приложите модель или фото."],
  ["Можно ли заказать без 3D-модели?", "Да. Можно отправить фото или эскиз, а мы оценим моделирование и подготовку к печати."],
  ["Что делает реверс-инжиниринг?", "Сканируем физическую деталь, восстанавливаем CAD-модель и готовим ее к производству."],
];

const INITIAL_ORDERS = [
  {
    id: "R22.0724.01",
    serviceId: "print",
    status: "На оценке",
    createdAt: "18.05.2026",
    task: "Напечатать тестовый корпус из PLA. Размер около 120 мм, нужна аккуратная поверхность.",
    material: "PLA",
    deadline: "3-5 дней",
    contact: "@projects.step3d",
    files: ["case_v3.stl"],
    managerComment: "Проверяем толщину стенок и ориентацию печати.",
  },
  {
    id: "R22.0723.14",
    serviceId: "scan",
    status: "В работе",
    createdAt: "17.05.2026",
    task: "Отсканировать небольшую техническую деталь и подготовить сетку OBJ.",
    material: "Не знаю",
    deadline: "1-2 недели",
    contact: "@projects.step3d",
    files: ["photo_01.jpg", "photo_02.jpg"],
    managerComment: "Нужны дополнительные фото с линейкой для оценки масштаба.",
  },
];

const EMPTY_ORDER = {
  mode: "consult",
  serviceId: "print",
  task: "",
  files: [],
  voice: false,
  material: "",
  deadline: "",
  contact: "@projects.step3d",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage can be unavailable inside some preview sandboxes.
    }
  }, [key, state]);

  return [state, setState];
}

function getService(serviceId) {
  return SERVICES.find((service) => service.id === serviceId) || SERVICES[0];
}

function getTodayRu() {
  return new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getNowRu() {
  return new Date().toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildOrderNumber() {
  return `R22.${new Date().getMonth() + 1}${String(new Date().getDate()).padStart(2, "0")}.${Math.floor(10 + Math.random() * 89)}`;
}

function calculateEstimate(order) {
  const basePrices = { print: 900, scan: 2500, model: 3000, reverse: 8000 };
  const baseDays = { print: 3, scan: 2, model: 5, reverse: 7 };
  const textFactor = order.task.length > 220 ? 1.25 : order.task.length > 80 ? 1.1 : 1;
  const fileFactor = order.files.length > 2 ? 1.15 : 1;
  const materialFactor = MATERIAL_MULTIPLIERS[order.material] || 1;
  const deadlineFactor = DEADLINE_MULTIPLIERS[order.deadline] || 1;
  const price = Math.round(((basePrices[order.serviceId] || 1000) * textFactor * fileFactor * materialFactor * deadlineFactor) / 100) * 100;
  const min = Math.max(500, Math.round((price * 0.85) / 100) * 100);
  const max = Math.round((price * 1.35) / 100) * 100;
  const days = Math.max(1, Math.round((baseDays[order.serviceId] || 3) * (order.deadline === "Срочно" ? 0.65 : 1)));
  return {
    priceRange: `${min.toLocaleString("ru-RU")} - ${max.toLocaleString("ru-RU")} ₽`,
    days: `${days}-${days + 2} дн.`,
    note: "Предварительно. Точная цена после проверки файла и ТЗ.",
  };
}

function buildOrderPayload(order, profile, orderNumber) {
  const estimate = calculateEstimate(order);
  return {
    order_id: orderNumber,
    request_type: order.mode === "create" ? "Создать" : "Узнать",
    created_at: getNowRu(),
    client_name: profile.name,
    contact: order.contact || profile.telegram,
    service: getService(order.serviceId).title,
    task: order.task,
    material: order.material || "Не указано",
    deadline: order.deadline || "Не указано",
    files: order.files,
    estimate: estimate.priceRange,
    status: "Новая",
  };
}

function getStatusClass(status) {
  const map = {
    Новая: "neutral",
    "На уточнении": "orange",
    "На оценке": "lime",
    Согласование: "blue",
    "В работе": "amber",
    Готово: "dark",
    Выдано: "green",
    Отменено: "red",
  };
  return map[status] || "neutral";
}

function LogoMark() {
  const active = new Set([0, 2, 3, 4, 5, 7]);
  return (
    <div className="logo-mark" aria-label="STEP_3D">
      <div className="logo-grid">
        {Array.from({ length: 9 }).map((_, index) => <div key={index} className={cn("logo-pixel", active.has(index) && "on")} />)}
      </div>
    </div>
  );
}

function Mascot({ size = "md", label = "STEP_3D" }) {
  return (
    <div className={cn("mascot-shell", size)}>
      <span className="mascot-dot-a" />
      <span className="mascot-dot-b" />
      <div className="robot" aria-hidden="true">
        <span className="ear left" />
        <span className="ear right" />
        <span className="head" />
        <span className="arm left" />
        <span className="arm right" />
        <span className="eye left" />
        <span className="eye right" />
        <span className="leg left" />
        <span className="leg right" />
      </div>
      <span className="mascot-label">{label}</span>
    </div>
  );
}

function Header({ title, screen, setScreen, onMenu, backTo = "home" }) {
  const canGoBack = screen !== "home";
  return (
    <header className="header">
      <button className="icon-button" onClick={() => (canGoBack ? setScreen(backTo) : onMenu())} aria-label={canGoBack ? "Назад" : "Меню"}>
        {canGoBack ? <ArrowLeft size={21} /> : <Menu size={22} />}
      </button>
      <div className="header-title">
        <div className="header-brand">STEP_3D</div>
        <div className="header-name">{title}</div>
      </div>
      <button className="icon-button" onClick={() => setScreen("profile")} aria-label="Профиль">
        <User size={21} />
      </button>
    </header>
  );
}

function Screen({ children, extraBottom = false, className = "" }) {
  return <main className={cn("content", extraBottom && "extra-bottom", className)}>{children}</main>;
}

function Card({ children, className = "", strong = false, dark = false, ...props }) {
  return <div className={cn("card", strong && "strong", dark && "dark", className)} {...props}>{children}</div>;
}

function AppButton({ children, onClick, variant = "dark", icon: Icon, disabled = false, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("btn", disabled ? "disabled" : variant, className)}>
      <span>{children}</span>
      {Icon && <Icon size={18} />}
    </button>
  );
}

function ServiceIcon({ service, active = false, small = false }) {
  const Icon = service.icon;
  return (
    <div className={cn("service-icon", small && "sm", service.id, active && "active")}>
      <Icon size={small ? 18 : 22} />
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={cn("badge", getStatusClass(status))}>{status}</span>;
}

function TagButton({ active, children, onClick }) {
  return <button className={cn("chip", active && "active")} onClick={onClick}>{children}</button>;
}

function ServicePicker({ value, onChange }) {
  return (
    <div className="service-picker">
      {SERVICES.map((service) => {
        const isActive = value === service.id;
        return (
          <button key={service.id} className={cn("service-pick", isActive && "active")} onClick={() => onChange(service.id)}>
            <div className="row" style={{ justifyContent: "center" }}>
              <ServiceIcon service={service} active={isActive} small />
            </div>
            <div className="service-pick-label">{service.short}</div>
          </button>
        );
      })}
    </div>
  );
}

function ReadinessBar({ value }) {
  return (
    <div className="readiness">
      <div className="readiness-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <div className="label">{label}</div>
      <div className="summary-value">{value || "Не указано"}</div>
    </div>
  );
}

function TabBar({ screen, setScreen }) {
  const tabs = [
    { id: "help", label: "Узнать", icon: HelpCircle },
    { id: "order", label: "Создать", icon: Send },
  ];
  return (
    <nav className="tabbar">
      <div className="tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = screen === tab.id || (tab.id === "orders" && screen === "orderDetails");
          return (
            <button key={tab.id} className={cn("tab", active && "active")} onClick={() => setScreen(tab.id)}>
              <Icon size={17} />
              <div className="tab-label">{tab.label}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div className="toast" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <span className="toast-dot" /> {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModelPreviewCard({ compact = false }) {
  return (
    <div className={cn("model-card", compact && "compact")}>
      <div className="model-toolbar">
        <div>
          <div className="model-title">case_v3.stl</div>
          <div className="model-sub">готово к оценке · 3D preview</div>
        </div>
        <div className="model-actions">
          <span className="model-status-dot" />
          <span className="badge lime">STL</span>
        </div>
      </div>
      <div className="model-stage" aria-label="3D модель">
        <div className="axis x" />
        <div className="axis y" />
        <div className="model-grid-glow" />
        <div className="model-cube">
          <span className="face front" />
          <span className="face top" />
          <span className="face side" />
        </div>
        <div className="model-shadow" />
        <div className="model-hint"><Rotate3D size={12} /> вращение · зум · крупно</div>
      </div>
      <div className="model-meta">
        <span><Ruler size={11} />120×68×42</span>
        <span><Box size={11} />86 см³</span>
        <span><Layers3 size={11} />PETG</span>
      </div>
    </div>
  );
}

function ChatMessage({ from = "bot", children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`chat-row ${from === "user" ? "user" : "bot"}`}
    >
      {from === "bot" && <div className="chat-avatar"><Bot size={15} /></div>}
      <div className="chat-bubble">{children}</div>
    </motion.div>
  );
}

function HomeScreen({ setScreen, openMenu, order, setOrder }) {
  const [draft, setDraft] = useState("");
  const quickActions = [
    ["Узнать", "consult"],
    ["Создать", "create"],
    ["Файл", "upload"],
  ];

  const startFlow = (mode) => {
    if (mode === "upload") {
      setOrder({ ...order, mode: "create", files: order.files.length ? order.files : ["case_v3.stl"] });
      setScreen("order");
      return;
    }
    setOrder({ ...order, mode });
    setScreen("order");
  };

  const sendDraft = () => {
    if (!draft.trim()) return;
    setOrder({ ...order, mode: "consult", task: draft.trim() });
    setScreen("order");
  };

  return (
    <div className="screen-root single-work-root">
      <Header title="STEP_3D" screen="home" setScreen={setScreen} onMenu={openMenu} />
      <Screen className="single-work-screen">
        <section className="single-hero">
          <div>
            <div className="kicker"><Sparkles size={13} /> один экран</div>
            <h1 className="h1">Чат и 3D — рядом</h1>
            <p className="text">Работаем в одном светлом пространстве: пишете задачу, смотрите модель, сразу уточняете цену, материал и срок.</p>
          </div>
          <div className="single-status"><span className="live-dot" /> инженер онлайн</div>
        </section>

        <section className="single-workspace">
          <div className="viewer-pane">
            <ModelPreviewCard compact />
          </div>
          <div className="workspace-steps">
            <span>Модель</span>
            <span>Диалог</span>
            <span>Оценка</span>
          </div>
          <div className="chat-thread single-thread">
            <ChatMessage delay={0.03}>Привет. Пришлите 3D-файл, фото или просто опишите деталь — всё разбираем здесь же.</ChatMessage>
            <ChatMessage from="user" delay={0.08}>Хочу понять, можно ли это напечатать и сколько будет стоить.</ChatMessage>
            <ChatMessage delay={0.13}>Можно. Я покажу модель в 3D, уточню размеры, материал и срок — без длинной анкеты и без оплаты на старте.</ChatMessage>
          </div>
        </section>

        <div className="single-actions">
          {quickActions.map(([label, mode]) => (
            <button key={label} onClick={() => startFlow(mode)}>{label}</button>
          ))}
        </div>

        <div className="single-composer">
          <button className="composer-icon" onClick={() => startFlow("upload")} aria-label="Загрузить файл"><Upload size={18} /></button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Напишите задачу или вопрос по модели..." />
          <button className="composer-send" onClick={sendDraft} aria-label="Отправить"><Send size={18} /></button>
        </div>
      </Screen>
    </div>
  );
}
function ServicesScreen({ setScreen, openMenu, order, setOrder }) {
  return (
    <div className="screen-root">
      <Header title="Услуги" screen="services" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <Card strong>
          <div className="row between gap-4">
            <div>
              <div className="kicker">каталог</div>
              <h2 className="h2">Выберите услугу</h2>
              <p className="text">Компактный выбор вместо перегруженной схемы: быстрее для мобильного UX.</p>
            </div>
            <Mascot size="sm" label={getService(order.serviceId).short} />
          </div>
        </Card>

        <div className="grid mt-4" style={{ gap: 12 }}>
          {SERVICES.map((service) => {
            const active = order.serviceId === service.id;
            return (
              <button key={service.id} className={cn("order-card", active && "active")} onClick={() => setOrder({ ...order, serviceId: service.id })}>
                <div className="row between gap-3">
                  <div className="row gap-3 min-w-0">
                    <ServiceIcon service={service} active={active} />
                    <div className="min-w-0">
                      <div className="title-sm">{service.title}</div>
                      <div className="text">{service.description}</div>
                    </div>
                  </div>
                  <span className="badge neutral">{service.price}</span>
                </div>
              </button>
            );
          })}
        </div>
        <AppButton className="mt-4" onClick={() => setScreen("order")} icon={ChevronRight}>Создать</AppButton>
      </Screen>
    </div>
  );
}

function OrderScreen({ setScreen, openMenu, order, setOrder, showToast }) {
  const [showWarning, setShowWarning] = useState(false);
  const service = getService(order.serviceId);
  const estimate = calculateEstimate(order);
  const isCreate = order.mode === "create";
  const flowTitle = isCreate ? "Создать заявку" : "Узнать цену и возможность";
  const flowHint = isCreate
    ? "Опишите, что нужно изготовить. Фото, модель и размеры ускорят запуск."
    : "Можно спросить по фото, идее, поломке или файлу — без обязательства заказывать.";
  const submitLabel = isCreate ? "Проверить заявку" : "Получить оценку";
  const canSubmit = Boolean(order.task.trim());
  const readyPercent = Math.min(100, 20 + (order.task ? 35 : 0) + (order.files.length ? 15 : 0) + (order.contact ? 15 : 0) + (order.material ? 10 : 0) + (order.deadline ? 5 : 0));

  const addFile = () => {
    const nextFile = `Файл_${order.files.length + 1}.stl`;
    setOrder({ ...order, files: [...order.files, nextFile] });
    showToast("Файл добавлен в заявку");
  };

  const removeFile = (fileName) => {
    setOrder({ ...order, files: order.files.filter((file) => file !== fileName) });
    showToast("Файл удален");
  };

  const nextStep = () => {
    if (!canSubmit) {
      setShowWarning(true);
      return;
    }
    setScreen("review");
  };

  return (
    <div className="screen-root">
      <Header title={isCreate ? "Создать" : "Узнать"} screen="order" setScreen={setScreen} onMenu={openMenu} />
      <Screen extraBottom>
        <Card strong>
          <div className="row between gap-4">
            <div>
              <div className="kicker">шаг 1 из 3 · {isCreate ? "заявка" : "оценка"}</div>
              <h2 className="h2">{flowTitle}</h2>
              <p className="text">{flowHint}</p>
            </div>
            <Mascot size="sm" label={service.short} />
          </div>
          <div className="mt-3"><ReadinessBar value={readyPercent} /></div>
          <div className="small" style={{ textAlign: "right", marginTop: 6, fontWeight: 900 }}>готовность {readyPercent}%</div>
        </Card>

        <div className="mt-4">
          <div className="label" style={{ marginBottom: 8 }}>Услуга</div>
          <ServicePicker value={order.serviceId} onChange={(serviceId) => setOrder({ ...order, serviceId })} />
        </div>

        <Card className="mt-4">
          <div className="row between">
            <div className="title-sm">Описание</div>
            <div className="small">{order.task.length}/500</div>
          </div>
          <textarea
            className="textarea mt-3"
            maxLength={500}
            value={order.task}
            onChange={(event) => { setShowWarning(false); setOrder({ ...order, task: event.target.value }); }}
            placeholder={isCreate ? "Например: корпус 120×80 мм, нужен PETG, 5 штук, есть STEP-файл..." : "Например: есть фото сломанной детали, хочу понять можно ли восстановить и сколько стоит..."}
          />
          <div className="prompt-chips">
            {(isCreate ? ["Есть 3D-файл", "Нужна прочная деталь", "Сделать 5 штук"] : ["Можно ли по фото?", "Какой материал?", "Сколько стоит?"]).map((hint) => (
              <button key={hint} type="button" onClick={() => setOrder({ ...order, task: order.task ? `${order.task} ${hint}` : hint })}>{hint}</button>
            ))}
          </div>
          {showWarning && <div className="warning">Добавьте короткое описание задачи.</div>}

          <div className="grid grid-2 mt-3">
            <button className="btn dark" onClick={addFile}><span><Upload size={18} /> Файл {order.files.length ? `· ${order.files.length}` : ""}</span></button>
            <button className={cn("btn", order.voice ? "lime" : "light")} onClick={() => setOrder({ ...order, voice: !order.voice })}><span><Mic size={18} /> Голос</span></button>
          </div>
          <div className="handoff-note"><ShieldCheck size={15} /> Тяжёлые STL/STEP/CAD-файлы можно дослать в Telegram с номером заявки. Конфиденциальные модели — после согласования/NDA.</div>

          {order.voice && <div className="voice-on"><span className="pulse-dot" /> Голосовая заметка включена</div>}
          {order.files.length > 0 && (
            <div className="grid mt-3" style={{ gap: 8 }}>
              {order.files.map((file) => (
                <div className="file-row" key={file}>
                  <div className="file-name"><FileText size={16} /><span className="truncate">{file}</span></div>
                  <button className="icon-mini" onClick={() => removeFile(file)} aria-label="Удалить файл"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="mt-4 smart-card">
          <div className="row between gap-3">
            <div className="title-sm">Параметры</div>
            <span className="mini-badge">можно пропустить</span>
          </div>
          <div className="mt-3">
            <div className="label" style={{ marginBottom: 8 }}>Материал</div>
            <div className="chips">{MATERIALS.map((material) => <TagButton key={material} active={order.material === material} onClick={() => setOrder({ ...order, material })}>{material}</TagButton>)}</div>
          </div>
          <div className="mt-4">
            <div className="label" style={{ marginBottom: 8 }}>Срок</div>
            <div className="chips">{DEADLINES.map((deadline) => <TagButton key={deadline} active={order.deadline === deadline} onClick={() => setOrder({ ...order, deadline })}>{deadline}</TagButton>)}</div>
          </div>
          <label className="mt-4" style={{ display: "block" }}>
            <div className="label" style={{ marginBottom: 8 }}>Контакт</div>
            <input className="input" value={order.contact} onChange={(event) => setOrder({ ...order, contact: event.target.value })} placeholder="Telegram, телефон или email" />
          </label>
        </Card>
      </Screen>

      <div className="sticky-order-bar">
        <div className="estimate-strip">
          <div>
            <div className="small" style={{ fontWeight: 950 }}>{isCreate ? "Предварительно" : "Ориентир после уточнения"}</div>
            <div className="title-sm">{estimate.priceRange}</div>
          </div>
          <span className="badge lime">{isCreate ? estimate.days : "оценка"}</span>
        </div>
        <button className={cn("btn", canSubmit ? "dark" : "disabled")} onClick={nextStep} style={{ width: "100%" }}>
          <span className="row gap-3"><span className="go-circle">Go</span><span><span style={{ display: "block" }}>{submitLabel}</span><span className="small" style={{ display: "block", color: "inherit", opacity: .68 }}>{isCreate ? "следующий шаг" : "без обязательства заказа"}</span></span></span>
          <ChevronRight size={21} />
        </button>
      </div>
    </div>
  );
}

function ReviewScreen({ setScreen, openMenu, order, submitOrder }) {
  const service = getService(order.serviceId);
  const estimate = calculateEstimate(order);
  const isCreate = order.mode === "create";
  return (
    <div className="screen-root">
      <Header title="Проверка" screen="review" setScreen={setScreen} onMenu={openMenu} backTo="order" />
      <Screen extraBottom>
        <Card strong>
          <div className="row between gap-4">
            <div>
              <div className="kicker">шаг 2 из 3 · {isCreate ? "заявка" : "оценка"}</div>
              <h2 className="h2">{isCreate ? "Проверьте заявку" : "Проверьте запрос"}</h2>
              <p className="text">{isCreate ? "Перед отправкой убедитесь, что менеджеру хватит данных для оценки." : "Запрос уйдет как вопрос на первичную оценку — заказать можно будет позже."}</p>
            </div>
            <Mascot size="sm" label="check" />
          </div>
        </Card>

        <Card className="lime mt-4">
          <div className="row between gap-3">
            <div>
              <div className="title-sm">{isCreate ? "Предварительная оценка" : "Запрос на консультацию"}</div>
              <div className="small">{isCreate ? estimate.note : "Менеджер проверит вводные и ответит по возможности, цене и сроку."}</div>
            </div>
            <span className="badge lime">{isCreate ? estimate.days : "ответ"}</span>
          </div>
          <div className="h2" style={{ marginTop: 12 }}>{isCreate ? estimate.priceRange : "Без обязательства заказа"}</div>
        </Card>

        <Card className="mt-4">
          <div className="row gap-3" style={{ marginBottom: 8 }}>
            <ServiceIcon service={service} small />
            <div>
              <div className="title-sm">{service.title}</div>
              <div className="small">{service.subtitle}</div>
            </div>
          </div>
          <SummaryRow label="Описание" value={order.task} />
          <SummaryRow label="Материал" value={order.material} />
          <SummaryRow label="Срок" value={order.deadline} />
          <SummaryRow label="Файлы" value={order.files.length ? order.files.join(", ") : "без файла"} />
          <SummaryRow label="Контакт" value={order.contact} />
        </Card>

        <Card className="trust-card mt-4">
          <div className="trust-points">
            <span>Без оплаты на старте</span>
            <span>Счёт и документы для B2B</span>
            <span>NDA для CAD</span>
          </div>
        </Card>

        <Card className="dark mt-4">
          <div className="row gap-3" style={{ alignItems: "flex-start" }}>
            <ShieldCheck size={22} style={{ color: "var(--lime)", flex: "0 0 auto" }} />
            <div>
              <div className="title-sm">Что произойдет после отправки</div>
              <p className="text" style={{ color: "#d8d8d8" }}>Заявка появится в истории, получит номер и будет доступна менеджеру для смены статуса.</p>
            </div>
          </div>
        </Card>
      </Screen>
      <div className="sticky-order-bar">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.55fr", gap: 8 }}>
          <button className="btn light" onClick={() => setScreen("order")}>Изменить</button>
          <button className="btn dark" onClick={submitOrder}>
            <span className="row gap-3"><span className="go-circle">Go</span><span>{isCreate ? "Подтвердить" : "Отправить запрос"}</span></span>
            <ChevronRight size={21} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ setScreen, openMenu, orderNumber, order }) {
  const service = getService(order.serviceId);
  const isCreate = order.mode === "create";
  return (
    <div className="screen-root" style={{ background: "white" }}>
      <Header title={isCreate ? "Заказ отправлен" : "Запрос отправлен"} screen="success" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <div style={{ textAlign: "center" }}>
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}><Mascot size="lg" label="OK" /></div>
          <h2 className="h2" style={{ marginTop: 22 }}>Спасибо, что обратились<br />в <span style={{ color: "#6c9d00" }}>STEP_3D Lab</span></h2>
          <p className="text">{isCreate ? `Заявка по услуге «${service.title}» создана. Мы свяжемся после первичной оценки.` : `Запрос по услуге «${service.title}» отправлен. Мы ответим по возможности, цене и сроку.`}</p>
        </div>
        <Card className="mt-4">
          <div className="row between">
            <div>
              <div className="small" style={{ fontWeight: 900 }}>{isCreate ? "Номер заказа" : "Номер запроса"}</div>
              <div className="h2">{orderNumber}</div>
            </div>
            <button className="icon-button"><Copy size={19} /></button>
          </div>
        </Card>
        <div className="grid grid-2 mt-4">
          <button className="cta-card lime" onClick={() => setScreen("status")}>
            <PackageCheck size={24} />
            <div className="cta-title" style={{ marginTop: 42 }}>Статус</div>
          </button>
          <button className="cta-card" onClick={() => setScreen("orders")} style={{ background: "white" }}>
            <ListOrdered size={24} />
            <div className="cta-title" style={{ marginTop: 42 }}>Заказы</div>
          </button>
        </div>
      </Screen>
    </div>
  );
}

function OrdersScreen({ setScreen, openMenu, orders, setSelectedOrderId }) {
  const [query, setQuery] = useState("");
  const filteredOrders = orders.filter((order) => {
    const service = getService(order.serviceId);
    return `${order.id} ${service.title} ${order.status} ${order.task}`.toLowerCase().includes(query.toLowerCase());
  });
  return (
    <div className="screen-root">
      <Header title="Мои заказы" screen="orders" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <Card strong>
          <div className="row between gap-4">
            <div>
              <div className="kicker">история</div>
              <h2 className="h2">Заказы STEP_3D</h2>
              <p className="text">Все заявки и статусы в одном месте.</p>
            </div>
            <div className="go-circle"><ListOrdered size={24} /></div>
          </div>
          <AppButton className="mt-3" onClick={() => setScreen("order")} icon={ChevronRight}>Создать</AppButton>
        </Card>

        <div className="search-box mt-4">
          <Search size={18} style={{ color: "#999" }} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по номеру, услуге, статусу" />
        </div>

        <div className="grid mt-4" style={{ gap: 12 }}>
          {filteredOrders.length === 0 && (
            <Card style={{ textAlign: "center" }}>
              <div className="row" style={{ justifyContent: "center" }}><div className="service-icon"><Search size={22} /></div></div>
              <div className="title-sm mt-3">Ничего не найдено</div>
              <div className="small">Попробуйте другой номер, услугу или статус.</div>
            </Card>
          )}
          {filteredOrders.map((item) => {
            const service = getService(item.serviceId);
            return (
              <button key={item.id} className="order-card" onClick={() => { setSelectedOrderId(item.id); setScreen("orderDetails"); }}>
                <div className="row between gap-3" style={{ alignItems: "flex-start" }}>
                  <div className="min-w-0 flex-1">
                    <div className="row gap-3 min-w-0">
                      <ServiceIcon service={service} small />
                      <div className="min-w-0">
                        <div className="title-sm truncate">{item.id}</div>
                        <div className="small">{item.createdAt}</div>
                      </div>
                    </div>
                    <div className="title-sm mt-3">{service.title}</div>
                    <p className="small line-clamp-2">{item.task}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </button>
            );
          })}
        </div>
      </Screen>
    </div>
  );
}

function OrderDetailsScreen({ setScreen, openMenu, selectedOrder }) {
  if (!selectedOrder) {
    return (
      <div className="screen-root">
        <Header title="Заказ" screen="orderDetails" setScreen={setScreen} onMenu={openMenu} backTo="orders" />
        <Screen><Card strong><div className="title-sm">Заказ не найден</div><AppButton className="mt-3" onClick={() => setScreen("orders")}>К заказам</AppButton></Card></Screen>
      </div>
    );
  }
  const service = getService(selectedOrder.serviceId);
  const estimate = calculateEstimate(selectedOrder);
  return (
    <div className="screen-root">
      <Header title="Карточка заказа" screen="orderDetails" setScreen={setScreen} onMenu={openMenu} backTo="orders" />
      <Screen>
        <Card strong>
          <div className="row between gap-3" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="label">Номер заказа</div>
              <div className="h2">{selectedOrder.id}</div>
              <div className="small"><CalendarDays size={15} /> {selectedOrder.createdAt}</div>
            </div>
            <ServiceIcon service={service} />
          </div>
          <div className="row between mt-3" style={{ background: "#f1f1ef", borderRadius: 16, padding: 12 }}>
            <div className="title-sm">{service.title}</div>
            <StatusBadge status={selectedOrder.status} />
          </div>
        </Card>
        <Card className="lime mt-4">
          <div className="row between gap-3">
            <div>
              <div className="title-sm">Предварительная оценка</div>
              <div className="small">{estimate.note}</div>
            </div>
            <span className="badge lime">{estimate.days}</span>
          </div>
          <div className="h2" style={{ marginTop: 12 }}>{estimate.priceRange}</div>
        </Card>
        <Card className="mt-4">
          <div className="title-sm">Описание задачи</div>
          <p className="text">{selectedOrder.task}</p>
          <div className="chips mt-3">
            {[selectedOrder.material, selectedOrder.deadline, `${selectedOrder.files.length} файл(ов)`].filter(Boolean).map((tag) => <span key={tag} className="badge neutral">{tag}</span>)}
          </div>
        </Card>
        <Card className="mt-4">
          <div className="title-sm">Файлы</div>
          <div className="grid mt-3" style={{ gap: 8 }}>
            {selectedOrder.files.map((file) => <div key={file} className="file-row"><div className="file-name"><FileText size={16} />{file}</div><ChevronRight size={16} /></div>)}
          </div>
        </Card>
        <Card className="mt-4">
          <div className="title-sm"><MessageSquare size={17} /> Комментарий менеджера</div>
          <p className="text">{selectedOrder.managerComment || "Комментарий появится после первичной оценки."}</p>
        </Card>
      </Screen>
    </div>
  );
}

function StatusScreen({ setScreen, openMenu, selectedOrder, orderNumber, order }) {
  const activeOrder = selectedOrder || { ...order, id: orderNumber, status: "На оценке", createdAt: getTodayRu(), managerComment: "Заявка принята в обработку." };
  const service = getService(activeOrder.serviceId);
  const timeline = [
    ["Заявка получена", "Описание и файлы сохранены", true],
    ["Первичная оценка", "Менеджер уточняет детали", true],
    ["Расчет стоимости", "Подбор технологии и материала", ["В работе", "Готово", "Выдано"].includes(activeOrder.status)],
    ["Согласование", "После оплаты запускаем работу", ["Готово", "Выдано"].includes(activeOrder.status)],
  ];
  return (
    <div className="screen-root">
      <Header title="Статус" screen="status" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <Card strong>
          <div className="row between gap-3" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="label">Заказ</div>
              <div className="h2">{activeOrder.id}</div>
              <div className="small">{service.title}</div>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>
        </Card>
        <Card className="mt-4">
          <div className="title-sm"><Clock3 size={17} /> Этапы обработки</div>
          <div className="grid mt-4" style={{ gap: 16 }}>
            {timeline.map(([title, text, done], index) => (
              <div key={title} className="row gap-3" style={{ alignItems: "flex-start" }}>
                <div className="badge" style={{ width: 32, height: 32, border: "2px solid var(--ink)", background: done ? "var(--lime)" : "white", color: "var(--ink)" }}>{done ? <Check size={15} /> : index + 1}</div>
                <div>
                  <div className="title-sm">{title}</div>
                  <div className="small">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="mt-4">
          <div className="title-sm">Краткое ТЗ</div>
          <p className="text">{activeOrder.task || "Описание задачи пока не заполнено."}</p>
        </Card>
      </Screen>
    </div>
  );
}

function HelpScreen({ setScreen, openMenu, order, setOrder }) {
  const [draft, setDraft] = useState("");
  const quickQuestions = ["Как выбрать материал?", "Нужен ли STL?", "Почему цена разная?", "Что проверить перед печатью?"];
  const lessons = [
    ["1", "Идея", "Понимаем задачу и назначение детали"],
    ["2", "Модель", "Файл, фото, эскиз или замер"],
    ["3", "Печать", "Материал, прочность, срок и цена"],
  ];
  const messages = [
    { from: "bot", text: "Привет. Я образовательный бот STEP_3D: объясняю простыми словами, как устроена 3D-печать и как подготовить задачу." },
    { from: "user", text: "Я не понимаю, с чего начать." },
    { from: "bot", text: "Начнём спокойно. Сначала выясняем, что должна делать деталь: держать нагрузку, выглядеть красиво, заменить сломанную часть или стать прототипом." },
    { from: "bot", text: "Потом смотрим, что у вас есть: 3D-файл, фото, чертёж, размеры или просто идея. Любой вариант подходит для старта." },
    { from: "user", text: "А если я не знаю материал?" },
    { from: "bot", text: "Это нормально. Я подскажу: PLA — для макетов, PETG — прочнее и практичнее, ABS — для нагрузки и температуры, смола — для детализации." },
  ];

  const sendDraft = () => {
    if (draft.trim()) { setOrder({ ...order, task: draft.trim(), mode: "consult" }); setScreen("order"); }
  };

  return (
    <div className="screen-root learn-root">
      <Header title="Узнать" screen="help" setScreen={setScreen} onMenu={openMenu} />
      <Screen className="chat-screen learn-screen">
        <div className="chat-intro learn-intro">
          <div>
            <div className="kicker"><Bot size={13} /> Образовательный чат</div>
            <h2 className="h2">Бот ведёт и просвещает</h2>
            <p className="text">Не заставляем сразу оформлять заказ. Объясняем, какие бывают файлы, материалы, сроки и что влияет на цену.</p>
          </div>
          <div className="chat-bot-avatar"><Sparkles size={25} /></div>
        </div>

        <div className="learning-path">
          {lessons.map(([num, title, text]) => (
            <div className="lesson-card" key={title}>
              <div className="lesson-num">{num}</div>
              <div>
                <div className="lesson-title">{title}</div>
                <div className="lesson-text">{text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-thread learn-thread">
          {messages.map((message, index) => (
            <motion.div
              key={`${message.from}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`chat-row ${message.from === "user" ? "user" : "bot"}`}
            >
              {message.from === "bot" && <div className="chat-avatar"><Bot size={15} /></div>}
              <div className="chat-bubble">{message.text}</div>
            </motion.div>
          ))}
        </div>

        <Card className="learn-card mt-4">
          <div className="title-sm"><HelpCircle size={17} /> Что можно узнать здесь</div>
          <div className="learn-grid mt-3">
            <span>как подготовить STL/STEP</span>
            <span>какой материал выбрать</span>
            <span>почему важны размеры</span>
            <span>как считается цена</span>
          </div>
        </Card>

        <div className="quick-chat-actions learn-actions">
          {quickQuestions.map((question) => (
            <button key={question} onClick={() => setDraft(question)}>{question}</button>
          ))}
        </div>

        <div className="chat-composer">
          <button className="chat-attach" aria-label="Задать голосом"><Mic size={18} /></button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Спросите про 3D-печать, модель, материал или цену..." />
          <button className="chat-send" onClick={sendDraft} aria-label="Отправить"><Send size={18} /></button>
        </div>

        <button className="chat-create" onClick={() => { setOrder({ ...order, mode: "consult", task: draft || order.task }); setScreen("order"); }}>
          <span>Перейти от обучения к оценке</span>
          <ChevronRight size={18} />
        </button>
      </Screen>
    </div>
  );
}

function ProfileScreen({ setScreen, openMenu, profile, setProfile, orders }) {
  const fields = [
    ["Имя", "name", User, ""],
    ["Telegram", "telegram", Send, "@username"],
    ["Телефон", "phone", Phone, "+7..."],
    ["Email", "email", Mail, "mail@example.ru"],
  ];
  return (
    <div className="screen-root">
      <Header title="Профиль" screen="profile" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <Card strong>
          <div className="row gap-4">
            <div className="go-circle" style={{ width: 80, height: 80 }}><User size={34} /></div>
            <div className="min-w-0">
              <div className="h2 truncate">{profile.name || "Клиент STEP_3D"}</div>
              <div className="text truncate">{profile.telegram || "Telegram не указан"}</div>
              <span className="badge neutral mt-3">{orders.length} заказа</span>
            </div>
          </div>
        </Card>
        <Card className="mt-4">
          <div className="title-sm"><Settings size={17} /> Контакты для связи</div>
          <div className="grid mt-3" style={{ gap: 12 }}>
            {fields.map(([label, key, Icon, placeholder]) => (
              <label key={key}>
                <div className="label" style={{ marginBottom: 8 }}><Icon size={13} /> {label}</div>
                <input className="input" value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} placeholder={placeholder} />
              </label>
            ))}
          </div>
        </Card>
        <div className="grid grid-2 mt-4">
          <button className="order-card"><Bell size={23} /><div className="title-sm mt-3">Уведомления</div></button>
          <button className="order-card" onClick={() => setScreen("orders")}><ListOrdered size={23} /><div className="title-sm mt-3">История</div></button>
        </div>
        <AppButton className="mt-4" onClick={() => setScreen("manager")} icon={ChevronRight}>Режим менеджера</AppButton>
      </Screen>
    </div>
  );
}

function ManagerScreen({ setScreen, openMenu, orders, setOrders, setSelectedOrderId, integration, showToast }) {
  const [filter, setFilter] = useState("Все");
  const stats = {
    total: orders.length,
    new: orders.filter((item) => item.status === "Новая" || item.status === "На оценке").length,
    work: orders.filter((item) => item.status === "В работе" || item.status === "Согласование").length,
    done: orders.filter((item) => item.status === "Готово" || item.status === "Выдано").length,
  };
  const managerFilters = ["Все", "Новая", "На оценке", "Согласование", "В работе", "Готово"];
  const filtered = filter === "Все" ? orders : orders.filter((item) => item.status === filter);

  const moveStatus = (orderId, direction = 1) => {
    setOrders((items) => items.map((item) => {
      if (item.id !== orderId) return item;
      const currentIndex = Math.max(0, ORDER_STATUSES.indexOf(item.status));
      const nextIndex = Math.max(0, Math.min(ORDER_STATUSES.length - 1, currentIndex + direction));
      const status = ORDER_STATUSES[nextIndex];
      return { ...item, status, managerComment: `Статус обновлен: ${status}.` };
    }));
    showToast("Статус заявки обновлен");
  };

  return (
    <div className="screen-root">
      <Header title="Менеджер" screen="manager" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <Card strong>
          <div className="row between gap-4">
            <div>
              <div className="kicker">CRM</div>
              <h2 className="h2">Панель заявок</h2>
              <p className="text">Статусы, заявки и подготовка к интеграции.</p>
            </div>
            <div className="go-circle"><ClipboardList size={26} /></div>
          </div>
        </Card>
        <div className="grid grid-4 mt-4">
          {[["Всего", stats.total], ["Новые", stats.new], ["В работе", stats.work], ["Готово", stats.done]].map(([label, value]) => (
            <Card key={label} style={{ padding: 12, textAlign: "center" }}><div className="h2">{value}</div><div className="small">{label}</div></Card>
          ))}
        </div>
        <div className="chips mt-4">{managerFilters.map((item) => <TagButton key={item} active={filter === item} onClick={() => setFilter(item)}>{item}</TagButton>)}</div>
        <Card className="mt-4">
          <div className="row between gap-3">
            <div>
              <div className="title-sm">Связь с таблицей</div>
              <div className="small">{integration.endpoint ? "Endpoint указан. Можно тестировать отправку." : "Готово для Google Apps Script."}</div>
            </div>
            <button className="badge dark" onClick={() => setScreen("integration")}>Настроить</button>
          </div>
        </Card>
        <div className="grid mt-4" style={{ gap: 12 }}>
          {filtered.length === 0 && <Card style={{ textAlign: "center" }}><div className="title-sm">Нет заявок в этом статусе</div><div className="small">Смените фильтр или создайте новую заявку.</div></Card>}
          {filtered.map((item) => {
            const service = getService(item.serviceId);
            return (
              <Card key={item.id}>
                <div className="row between gap-3" style={{ alignItems: "flex-start" }}>
                  <div className="min-w-0 flex-1">
                    <div className="row gap-3 min-w-0">
                      <ServiceIcon service={service} small />
                      <div className="min-w-0">
                        <div className="title-sm truncate">{item.id}</div>
                        <div className="small">{service.title}</div>
                      </div>
                    </div>
                    <p className="small line-clamp-2">{item.task}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="grid grid-3 mt-3">
                  <button className="chip" onClick={() => moveStatus(item.id, -1)}>Назад</button>
                  <button className="chip active" onClick={() => { setSelectedOrderId(item.id); setScreen("orderDetails"); }}>Открыть</button>
                  <button className="chip" style={{ background: "var(--lime)", color: "var(--ink)", borderColor: "var(--lime)" }} onClick={() => moveStatus(item.id, 1)}>Дальше</button>
                </div>
              </Card>
            );
          })}
        </div>
      </Screen>
    </div>
  );
}

function IntegrationScreen({ setScreen, openMenu, integration, setIntegration, order, profile, orderNumber, showToast }) {
  const payload = buildOrderPayload(order, profile, orderNumber);
  const runTestSync = () => {
    const nextSync = getNowRu();
    setIntegration({ ...integration, lastSync: nextSync, status: integration.endpoint ? "Подключено" : "Демо-режим" });
    showToast(integration.endpoint ? "Тестовая отправка подготовлена" : "Демо-синхронизация выполнена");
  };
  return (
    <div className="screen-root">
      <Header title="Интеграция" screen="integration" setScreen={setScreen} onMenu={openMenu} />
      <Screen>
        <Card strong>
          <div className="row between gap-4">
            <div>
              <div className="kicker">backend</div>
              <h2 className="h2">Связь с Google Sheet</h2>
              <p className="text">Telegram WebApp → Apps Script → Google Таблица.</p>
            </div>
            <div className="go-circle"><Database size={26} /></div>
          </div>
        </Card>
        <Card className="mt-4">
          <div className="row between gap-3">
            <div>
              <div className="title-sm">Статус подключения</div>
              <div className="small">{integration.lastSync ? `Последняя синхронизация: ${integration.lastSync}` : "Синхронизации еще не было"}</div>
            </div>
            <span className="badge lime">{integration.status}</span>
          </div>
        </Card>
        <Card className="mt-4">
          <label>
            <div className="title-sm" style={{ marginBottom: 8 }}>Apps Script endpoint</div>
            <input className="input" value={integration.endpoint} onChange={(event) => setIntegration({ ...integration, endpoint: event.target.value })} placeholder="https://script.google.com/macros/s/.../exec" />
          </label>
        </Card>
        <Card className="mt-4">
          <div className="title-sm"><ShieldCheck size={17} /> Payload заявки</div>
          <pre style={{ margin: "12px 0 0", maxHeight: 260, overflow: "auto", background: "var(--ink)", color: "#d8ff8f", borderRadius: 18, padding: 14, fontSize: 10, lineHeight: 1.45 }}>{JSON.stringify(payload, null, 2)}</pre>
        </Card>
        <AppButton className="mt-4" onClick={runTestSync} icon={RefreshCcw}>Тест синхронизации</AppButton>
      </Screen>
    </div>
  );
}

function MenuScreen({ setScreen, closeMenu, order, setOrder }) {
  const cards = [
    ["3D печать", "Изделия", Printer, "print"],
    ["3D скан", "Точность", ScanLine, "scan"],
    ["Моделирование", "CAD", Box, "model"],
    ["Реверс", "По образцу", Wand2, "reverse"],
    ["Примеры", "Портфолио", ImageIcon, null, "services"],
    ["Вопросы", "FAQ", HelpCircle, null, "help"],
    ["Менеджер", "Статусы", Settings, null, "manager"],
    ["Интеграция", "Таблица", Database, null, "integration"],
  ];
  return (
    <div className="menu-screen">
      <div className="menu-header">
        <button className="icon-button" style={{ background: "rgba(255,255,255,.1)", color: "white", borderColor: "rgba(255,255,255,.12)" }} onClick={closeMenu}><X size={22} /></button>
        <div className="header-title"><div className="header-brand" style={{ color: "rgba(255,255,255,.45)" }}>STEP_3D</div><div className="header-name">Подробнее</div></div>
        <LogoMark />
      </div>
      <div className="menu-content">
        <div className="card" style={{ background: "rgba(255,255,255,.1)", color: "white", borderColor: "rgba(255,255,255,.14)" }}>
          <div className="row between gap-4"><div><div className="kicker" style={{ color: "rgba(255,255,255,.55)" }}>связаться со</div><div className="h2">STEP_3D</div></div><Mascot size="sm" label="lab" /></div>
        </div>
        <div className="grid grid-2 mt-4">
          {cards.map(([title, text, Icon, serviceId, target]) => (
            <button key={title} className="menu-card" onClick={() => {
              if (serviceId) {
                setOrder({ ...order, serviceId });
                setScreen("order");
              } else {
                setScreen(target || "services");
              }
            }}>
              <div className="menu-icon"><Icon size={21} /></div>
              <div className="title-sm">{title}</div>
              <div className="small">{text}</div>
            </button>
          ))}
        </div>
        <div className="grid grid-2 mt-4">
          <button className="btn" style={{ background: "rgba(255,255,255,.1)", color: "white", borderColor: "rgba(255,255,255,.14)", justifyContent: "center" }}><Share2 size={18} /> Поделиться</button>
          <button className="btn lime" style={{ justifyContent: "center" }}><Send size={18} /> Подписаться</button>
        </div>
      </div>
    </div>
  );
}

function DesktopNotes({ setScreen }) {
  const items = [
    [MessageSquare, "Заявка", "проверка перед отправкой", "order"],
    [Printer, "Услуги", "компактный каталог", "services"],
    [ListOrdered, "Заказы", "поиск и карточки", "orders"],
    [Settings, "Менеджер", "мини-CRM", "manager"],
    [Database, "Интеграция", "payload и endpoint", "integration"],
  ];
  return (
    <aside className="desktop-panel">
      <div className="desktop-kicker"><Sparkles size={17} /> UX/UI polished MVP</div>
      <h1 className="desktop-title">STEP_3D<br />chat + 3D</h1>
      <p className="desktop-copy">Новая архитектура: один чат-бот, внутри которого пользователь загружает модель, видит её в 3D и тут же обсуждает цену, срок и производство.</p>
      <div className="desktop-links">
        {items.map(([Icon, title, sub, target]) => (
          <button key={title} className="desktop-link" onClick={() => setScreen(target)}>
            <div className="desktop-link-icon"><Icon size={21} /></div>
            <div><div className="desktop-link-title">{title}</div><div className="desktop-link-sub">{sub}</div></div>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [previousScreen, setPreviousScreen] = useState("home");
  const [orderNumber, setOrderNumber] = useState("R22.0724.01");
  const [orders, setOrders] = usePersistentState("step3d.orders", INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = usePersistentState("step3d.selectedOrderId", INITIAL_ORDERS[0].id);
  const [profile, setProfile] = usePersistentState("step3d.profile", { name: "Никита", telegram: "@projects.step3d", phone: "", email: "" });
  const [order, setOrder] = usePersistentState("step3d.orderDraft", EMPTY_ORDER);
  const [integration, setIntegration] = usePersistentState("step3d.integration", { endpoint: "", status: "Демо-режим", lastSync: "" });
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const selectedOrder = useMemo(() => orders.find((item) => item.id === selectedOrderId), [orders, selectedOrderId]);
  const currentTitle = useMemo(() => ({
    home: "Главный экран",
    services: "Услуги",
    order: "Создание заказа",
    review: "Проверка заявки",
    success: "Подтверждение",
    status: "Статус заказа",
    orders: "Мои заказы",
    orderDetails: "Карточка заказа",
    help: "Помощь",
    profile: "Профиль",
    menu: "Подробнее",
    manager: "Панель менеджера",
    integration: "Интеграция",
  }[screen] || "Прототип"), [screen]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1800);
  };

  const openMenu = () => {
    setPreviousScreen(screen === "menu" ? previousScreen : screen);
    setScreen("menu");
  };
  const closeMenu = () => setScreen(previousScreen || "home");

  const submitOrder = () => {
    const nextNumber = buildOrderNumber();
    const newOrder = {
      id: nextNumber,
      serviceId: order.serviceId,
      mode: order.mode,
      status: order.mode === "create" ? "Новая" : "На оценке",
      createdAt: getTodayRu(),
      task: order.task,
      material: order.material || "Не указано",
      deadline: order.deadline || "Не указано",
      contact: order.contact || profile.telegram,
      files: order.files.length ? order.files : ["без файла"],
      managerComment: "Заявка создана. Менеджер скоро начнет первичную оценку.",
    };
    setOrderNumber(nextNumber);
    setOrders((items) => [newOrder, ...items]);
    setSelectedOrderId(nextNumber);
    setOrder({ ...EMPTY_ORDER, mode: "consult", contact: profile.telegram || "" });
    setScreen("success");
    showToast(order.mode === "create" ? "Заявка отправлена" : "Запрос отправлен");
  };

  const showTabs = screen !== "menu" && screen !== "home";

  return (
    <div className="app-stage">
      <DesktopNotes setScreen={setScreen} />
      <div className="phone-wrap">
        <div className="phone-caption"><span className="phone-caption-dot" />{currentTitle}</div>
        <div className="phone">
          <Toast message={toast} />
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} style={{ height: "100%" }}>
              {screen === "home" && <HomeScreen setScreen={setScreen} openMenu={openMenu} order={order} setOrder={setOrder} orders={orders} />}
              {screen === "services" && <ServicesScreen setScreen={setScreen} openMenu={openMenu} order={order} setOrder={setOrder} />}
              {screen === "order" && <OrderScreen setScreen={setScreen} openMenu={openMenu} order={order} setOrder={setOrder} showToast={showToast} />}
              {screen === "review" && <ReviewScreen setScreen={setScreen} openMenu={openMenu} order={order} submitOrder={submitOrder} />}
              {screen === "success" && <SuccessScreen setScreen={setScreen} openMenu={openMenu} orderNumber={orderNumber} order={orders.find((item) => item.id === selectedOrderId) || order} />}
              {screen === "status" && <StatusScreen setScreen={setScreen} openMenu={openMenu} selectedOrder={selectedOrder} orderNumber={orderNumber} order={order} />}
              {screen === "orders" && <OrdersScreen setScreen={setScreen} openMenu={openMenu} orders={orders} setSelectedOrderId={setSelectedOrderId} />}
              {screen === "orderDetails" && <OrderDetailsScreen setScreen={setScreen} openMenu={openMenu} selectedOrder={selectedOrder} />}
              {screen === "help" && <HelpScreen setScreen={setScreen} openMenu={openMenu} order={order} setOrder={setOrder} />}
              {screen === "profile" && <ProfileScreen setScreen={setScreen} openMenu={openMenu} profile={profile} setProfile={setProfile} orders={orders} />}
              {screen === "manager" && <ManagerScreen setScreen={setScreen} openMenu={openMenu} orders={orders} setOrders={setOrders} setSelectedOrderId={setSelectedOrderId} integration={integration} showToast={showToast} />}
              {screen === "integration" && <IntegrationScreen setScreen={setScreen} openMenu={openMenu} integration={integration} setIntegration={setIntegration} order={order} profile={profile} orderNumber={orderNumber} showToast={showToast} />}
              {screen === "menu" && <MenuScreen setScreen={setScreen} closeMenu={closeMenu} order={order} setOrder={setOrder} />}
            </motion.div>
          </AnimatePresence>
          {showTabs && <TabBar screen={screen} setScreen={setScreen} />}
        </div>
      </div>
    </div>
  );
}
