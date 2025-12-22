import { useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import PageContainer from "../components/layout/PageContainer";
import AppCard from "../components/layout/AppCard";

type Contact = {
  id: string;
  name: string;
  birthday?: string;
};

const STORAGE_KEY = "contacts_v1";
const SEEN_KEY = "notifications_seen_at";

const getUpcomingBirthdays = (contacts: Contact[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return contacts
    .filter(contact => contact.birthday)
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
      <PageContainer>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Notificações
            </Typography>
          </Stack>

          <AppCard sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Aniversários
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  onClick={markAsSeen}
                  startIcon={<CheckRoundedIcon fontSize="small" />}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Marcar como visto
                </Button>
              </Stack>

              {upcoming.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhum aniversario nos proximos dias.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {upcoming.map(item => (
                    <Paper
                      key={item.contact.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.contact.name || "Contato sem nome"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {item.next.toLocaleDateString("pt-BR")} · em{" "}
                        {item.diffDays} dia(s)
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </AppCard>
        </Stack>
      </PageContainer>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {item.next.toLocaleDateString("pt-BR")} · em{" "}
                      {item.diffDays} dia(s)
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={markAsSeen}>
                Marcar como visto
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
