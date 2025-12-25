import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";

import CakeRoundedIcon from "@mui/icons-material/CakeRounded";
import PageContainer from "../components/layout/PageContainer";
import CardSection from "../components/layout/CardSection";
import { loadUserStorage, saveUserStorage } from "../userStorage";
import { interactiveCardSx } from "../styles/interactiveCard";
import { useLocation } from "wouter";

type Contact = {
  id: string;
  name: string;
  birthday?: string;
};

type CompletedTaskNotification = {
  id: string;
  taskId: string;
  taskName: string;
  completedAt: string;
};

const STORAGE_KEY = "contacts_v1";
const SEEN_KEY = "notifications_seen_at";
const COMPLETED_TASKS_KEY = "sc_completed_tasks_notifications";
const TASK_SEEN_KEY = "notifications_tasks_seen_at";

const getUpcomingBirthdays = (contacts: Contact[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return contacts
    .filter(contact => typeof contact.birthday === "string" && contact.birthday)
    .map(contact => {
      const parts = String(contact.birthday).split("-").map(Number);
      if (parts.length < 3) {
        return null;
      }
      const [, month, day] = parts;
      if (!month || !day) {
        return null;
      }
      const next = new Date(today.getFullYear(), month - 1, day);
      next.setHours(0, 0, 0, 0);
      if (next < today) {
        next.setFullYear(today.getFullYear() + 1);
      }
      const diffDays = Math.round(
        (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { contact, next, diffDays };
    })
    .filter(
      (item): item is { contact: Contact; next: Date; diffDays: number } =>
        Boolean(item)
    )
    .filter(item => item.diffDays >= 0 && item.diffDays <= 7)
    .sort((a, b) => a.diffDays - b.diffDays);
};

export default function Notifications() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTaskNotification[]>([]);

  const populateTestData = () => {
    const now = new Date();
    const testNotifications: CompletedTaskNotification[] = [
      {
        id: `test-${Date.now()}-1`,
        taskId: "task-1",
        taskName: "Revisar proposta comercial cliente ABC",
        completedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min atrás
      },
      {
        id: `test-${Date.now()}-2`,
        taskId: "task-2",
        taskName: "Enviar relatório mensal de vendas",
        completedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min atrás
      },
      {
        id: `test-${Date.now()}-3`,
        taskId: "task-3",
        taskName: "Reunião de planejamento Q1 2026",
        completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
      },
      {
        id: `test-${Date.now()}-4`,
        taskId: "task-4",
        taskName: "Atualizar documentação do projeto",
        completedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5h atrás
      },
      {
        id: `test-${Date.now()}-5`,
        taskId: "task-5",
        taskName: "Fazer code review do PR #234",
        completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
      },
      {
        id: `test-${Date.now()}-6`,
        taskId: "task-6",
        taskName: "Preparar apresentação para cliente",
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
      },
      {
        id: `test-${Date.now()}-7`,
        taskId: "task-7",
        taskName: "Agendar entrevistas técnicas",
        completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
      },
      {
        id: `test-${Date.now()}-8`,
        taskId: "task-8",
        taskName: "Configurar ambiente de produção",
        completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 dias atrás
      },
    ];
    
    setCompletedTasks(testNotifications);
    window.localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(testNotifications));
    void saveUserStorage(COMPLETED_TASKS_KEY, testNotifications);
  };

  const loadCompletedTasks = useCallback(async () => {
    // Tentar carregar do banco de dados primeiro
    const dbTasks = await loadUserStorage<CompletedTaskNotification[]>(COMPLETED_TASKS_KEY);
    if (dbTasks && Array.isArray(dbTasks) && dbTasks.length > 0) {
      // Filtrar notificações demo (ids começam com "demo-")
      const realTasks = dbTasks.filter(task => !task.id.startsWith('demo-'));
      setCompletedTasks(realTasks);
      window.localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(realTasks));
      // Se limpou demos, salvar a versão limpa no banco
      if (realTasks.length !== dbTasks.length) {
        void saveUserStorage(COMPLETED_TASKS_KEY, realTasks);
      }
      return;
    }

    // Se não houver no banco, tentar localStorage
    const stored = window.localStorage.getItem(COMPLETED_TASKS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CompletedTaskNotification[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filtrar notificações demo
          const realTasks = parsed.filter(task => !task.id.startsWith('demo-'));
          setCompletedTasks(realTasks);
          // Salvar versão limpa
          window.localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(realTasks));
          void saveUserStorage(COMPLETED_TASKS_KEY, realTasks);
          return;
        }
      } catch {
        // Sem notificações
      }
    }

    // Sem notificações - mostrar lista vazia
    setCompletedTasks([]);
  }, []);

  useEffect(() => {
    const load = async () => {
      const dbContacts = await loadUserStorage<Contact[]>(STORAGE_KEY);
      if (Array.isArray(dbContacts)) {
        setContacts(dbContacts);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dbContacts));
        return;
      }
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Contact[];
        if (Array.isArray(parsed)) {
          setContacts(parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    };
    void load();
    loadCompletedTasks();

    // Escutar evento de tarefa completada
    const handleTaskCompleted = () => loadCompletedTasks();
    window.addEventListener("task-completed", handleTaskCompleted);
    return () => window.removeEventListener("task-completed", handleTaskCompleted);
  }, [loadCompletedTasks]);

  const upcoming = useMemo(() => getUpcomingBirthdays(contacts), [contacts]);

  const markNotificationAsViewed = (notificationId: string, type: 'task' | 'birthday') => {
    if (type === 'task') {
      // Remover tarefa da lista
      const updatedTasks = completedTasks.filter(task => task.id !== notificationId);
      setCompletedTasks(updatedTasks);
      window.localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(updatedTasks));
      void saveUserStorage(COMPLETED_TASKS_KEY, updatedTasks);
    } else if (type === 'birthday') {
      // Para aniversários, apenas marcar timestamp de visto
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(SEEN_KEY, timestamp);
      void saveUserStorage(SEEN_KEY, timestamp);
      window.dispatchEvent(new Event("contacts-change"));
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    return `Há ${diffDays} dias`;
  };


  const [, setLocation] = useLocation();
  const isMd = useMediaQuery('(min-width:900px)');
  const is1080 = useMediaQuery('(max-width:1080px)');

  const handleTaskClick = (taskId: string) => {
    // Vai para a tela do calendário e abre o modal da tarefa
    setLocation(`/calendario?task=${taskId}`);
  };

  // Combinar todas as notificações
  type Notification = {
    id: string;
    type: 'task' | 'birthday';
    title: string;
    subtitle: string;
    icon: 'task' | 'birthday';
    onClick?: () => void;
  };

  const allNotifications = useMemo(() => {
    const notifications: Notification[] = [];

    // Adicionar tarefas concluídas
    completedTasks.forEach(task => {
      notifications.push({
        id: task.id,
        type: 'task',
        title: task.taskName,
        subtitle: `Concluída · ${formatTimeAgo(task.completedAt)}`,
        icon: 'task',
        onClick: () => handleTaskClick(task.taskId),
      });
    });

    // Adicionar aniversários
    upcoming.forEach(item => {
      notifications.push({
        id: item.contact.id,
        type: 'birthday',
        title: item.contact.name || "Contato sem nome",
        subtitle: `${item.next.toLocaleDateString("pt-BR")} · em ${item.diffDays} dia(s)`,
        icon: 'birthday',
      });
    });

    return notifications;
  }, [completedTasks, upcoming]);

  const hasAnyNotification = allNotifications.length > 0;

  return (
    <PageContainer>
      <Stack spacing={3}>
        <CardSection>
          <Stack spacing={2}>
            {/* Botão de debug para popular dados de teste */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={populateTestData}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Popular 8 notificações de teste
              </Button>
            </Box>

            {!hasAnyNotification ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhuma notificação recente.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: is1080 ? '1fr 1fr 1fr' : (isMd ? '1fr 1fr 1fr' : '1fr 1fr'),
                  },
                  gap: 2,
                  '@media (max-width:1080px)': {
                    gridTemplateColumns: '1fr 1fr 1fr',
                  },
                }}
              >
                {allNotifications.map(notification => (
                  <CardSection
                    size="xs"
                    key={notification.id}
                    sx={{
                      minHeight: 64,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          mt: 0.5,
                          color: notification.icon === 'task' ? 'text.secondary' : 'primary.main',
                        }}
                      >
                        {notification.icon === 'task' ? (
                          <AssignmentTurnedInRoundedIcon fontSize="small" />
                        ) : (
                          <CakeRoundedIcon fontSize="small" />
                        )}
                      </Box>
                      <Stack sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {notification.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {notification.subtitle}
                        </Typography>
                      </Stack>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => markNotificationAsViewed(notification.id, notification.type)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        alignSelf: "flex-end",
                        color: "var(--md-sys-color-primary)",
                      }}
                    >
                      Marcar como vista
                    </Button>
                  </CardSection>
                ))}
              </Box>
            )}
          </Stack>
        </CardSection>
      </Stack>
    </PageContainer>
  );
}
