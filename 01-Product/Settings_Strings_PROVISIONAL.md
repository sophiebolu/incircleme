# Settings & Account strings — PROVISIONAL (for sign-off)

Branch `feat/settings-account`. Wired in `incircleme-mvp/packages/i18n` under `set_*`,
`ep_*`, `da_*` keys, marked **PROVISIONAL**. Reading order CA → ES → EN; **CA ships by
default**. Promote into the Vocabulary Lock once signed off, then drop the markers.

Notes:
- Language labels (`set_lang_*`) are each in their own language and identical across locales.
- `set_notif*` strings back the Notifications **placeholder** (reuses onboarding's
  `notification_prefs`, a parallel branch) — copy can be reviewed now; toggles go live on merge.
- Deactivate copy is deliberately **warm/reversible** — no scare wording.

## Settings hub
| key | CA | ES | EN |
|---|---|---|---|
| `set_title` | Configuració | Ajustes | Settings |
| `set_notifications` | Notificacions | Notificaciones | Notifications |
| `set_language` | Idioma | Idioma | Language |
| `set_account` | Compte | Cuenta | Account |
| `set_legalSection` | Privadesa i condicions | Privacidad y condiciones | Privacy & terms |
| `set_editProfile` | Edita el perfil | Editar perfil | Edit profile |
| `set_deactivate` | Desactiva el compte | Desactivar la cuenta | Deactivate account |
| `set_privacyPolicy` | Política de privadesa | Política de privacidad | Privacy Policy |
| `set_terms` | Condicions | Condiciones | Terms |
| `set_lang_ca` / `set_lang_es` / `set_lang_en` | Català · Español · English | *(same)* | *(same)* |

## Notifications (placeholder copy)
| key | CA | ES | EN |
|---|---|---|---|
| `set_notif_bookings` | Les teves reserves | Tus reservas | Your bookings |
| `set_notif_circles` | Els teus Cercles | Tus Círculos | Your Circles |
| `set_notif_nearby` | Nou al teu barri | Nuevo en tu barrio | New in your neighbourhood |
| `set_notif_always` | Sempre actiu | Siempre activo | Always on |
| `set_notifManaged` | Els vas triar a l’onboarding. Els controls complets arriben quan s’activin. | Las elegiste en el onboarding. Los controles completos llegan cuando se activen. | You picked these during onboarding. Full controls arrive when it ships. |

## Edit profile
| key | CA | ES | EN |
|---|---|---|---|
| `ep_title` | Edita el perfil | Editar perfil | Edit profile |
| `ep_photo` | Foto | Foto | Photo |
| `ep_changePhoto` | Canvia la foto | Cambiar la foto | Change photo |
| `ep_name` | Nom | Nombre | Name |
| `ep_namePlaceholder` | El teu nom | Tu nombre | Your name |
| `ep_bio` | Sobre tu | Sobre ti | About you |
| `ep_bioPlaceholder` | Una frase sobre tu | Una frase sobre ti | A line about you |
| `ep_barrio` | Barri | Barrio | Barrio |
| `ep_barrioPlaceholder` | El teu barri | Tu barrio | Your barrio |
| `ep_language` | Idioma | Idioma | Language |
| `ep_save` | Desa | Guardar | Save |
| `ep_saved` | Desat | Guardado | Saved |

## Deactivate (warm · reversible)
| key | CA | ES | EN |
|---|---|---|---|
| `da_title` | Desactiva el compte | Desactivar la cuenta | Deactivate account |
| `da_body` | El teu compte i tot el que has construït es queden tal com estan. Desapareixeràs del públic i no podràs reservar ni organitzar mentrestant. | Tu cuenta y todo lo que has construido se quedan como están. Desaparecerás de lo público y no podrás reservar ni organizar mientras tanto. | Your account and everything you’ve built stay exactly as they are. You’ll disappear from public view and can’t book or host in the meantime. |
| `da_reversible` | Pots tornar quan vulguis — només cal tornar a entrar. | Puedes volver cuando quieras — solo vuelve a entrar. | You can come back any time — just sign in again. |
| `da_confirm` | Desactiva el compte | Desactivar la cuenta | Deactivate account |
| `da_cancel` | Ara no | Ahora no | Not now |
| `da_done` | El teu compte està desactivat. T’esperem. | Tu cuenta está desactivada. Te esperamos. | Your account is deactivated. We’ll keep your seat warm. |
