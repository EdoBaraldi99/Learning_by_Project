/* ============================================================
   i18n — Motore di traduzione multilingua (it / en / fr / de / es / sq / nl)
   ============================================================
   Autosufficiente come session.js: nessuna dipendenza da librerie esterne.
   - I18N.t(key, params)      restituisce la stringa tradotta nella lingua
                               corrente (con sostituzione {placeholder})
   - I18N.getLang() / setLang(code)   persistenza in localStorage, SEPARATA
                               dalla sessione utente (non viene mai toccata
                               al login/logout, quindi cambiare lingua non
                               ha alcun effetto sulla sessione)
   - I18N.applyTranslations(root)     applica le traduzioni a tutti gli
                               elementi con data-i18n / data-i18n-placeholder
                               / data-i18n-aria-label dentro "root"
   - I18N.initLanguageSwitcher(btnSelector) collega il pulsante "Cambia lingua"
                               già presente nell'HTML (icona mondo + bandiera +
                               nome lingua) a un menu a tendina generato via JS
   ============================================================ */

const I18N_LANG_KEY = 'appLanguage';
const I18N_DEFAULT_LANG = 'it';

// Bandiere in SVG puro (nessun asset esterno), stesso stile 3x2 già usato per l'Italia.
const I18N_FLAGS = {
    it: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="2" x="0" fill="#009246"/><rect width="1" height="2" x="1" fill="#F1F2F1"/><rect width="1" height="2" x="2" fill="#CE2B37"/></svg>',
    en: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="3" height="2" fill="#00247d"/><path d="M0,0 L3,2 M3,0 L0,2" stroke="#ffffff" stroke-width="0.4"/><path d="M0,0 L3,2 M3,0 L0,2" stroke="#cf142b" stroke-width="0.15"/><path d="M1.5,0 V2 M0,1 H3" stroke="#ffffff" stroke-width="0.6"/><path d="M1.5,0 V2 M0,1 H3" stroke="#cf142b" stroke-width="0.3"/></svg>',
    fr: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="2" x="0" fill="#0055A4"/><rect width="1" height="2" x="1" fill="#FFFFFF"/><rect width="1" height="2" x="2" fill="#EF4135"/></svg>',
    de: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="3" height="0.667" y="0" fill="#000000"/><rect width="3" height="0.667" y="0.667" fill="#DD0000"/><rect width="3" height="0.667" y="1.333" fill="#FFCE00"/></svg>',
    es: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="3" height="2" fill="#AA151B"/><rect width="3" height="1" y="0.5" fill="#F1BF00"/></svg>',
    sq: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="3" height="2" fill="#E41E20"/><path d="M1.5,0.55 l0.13,0.28 l0.3,0.03 l-0.22,0.2 l0.07,0.29 l-0.28,-0.15 l-0.28,0.15 l0.07,-0.29 l-0.22,-0.2 l0.3,-0.03 z" fill="#000000"/></svg>',
    nl: '<svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg"><rect width="3" height="0.667" y="0" fill="#AE1C28"/><rect width="3" height="0.667" y="0.667" fill="#FFFFFF"/><rect width="3" height="0.667" y="1.333" fill="#21468B"/></svg>'
};

const I18N_LANGUAGES = [
    { code: 'it', nameKey: 'lang.name.it' },
    { code: 'en', nameKey: 'lang.name.en' },
    { code: 'fr', nameKey: 'lang.name.fr' },
    { code: 'de', nameKey: 'lang.name.de' },
    { code: 'es', nameKey: 'lang.name.es' },
    { code: 'sq', nameKey: 'lang.name.sq' },
    { code: 'nl', nameKey: 'lang.name.nl' }
];

const I18N_STRINGS = {
    it: {
        'lang.change': 'Cambia lingua',
        'lang.name.it': 'Italiano', 'lang.name.en': 'Inglese', 'lang.name.fr': 'Francese',
        'lang.name.de': 'Tedesco', 'lang.name.es': 'Spagnolo', 'lang.name.sq': 'Albanese', 'lang.name.nl': 'Olandese',

        'nav.ariaLabel': 'Navigazione principale',
        'nav.dashboard': 'Dashboard', 'nav.progetti': 'Progetti', 'nav.attivita': 'Attività',
        'nav.utenti': 'Utenti', 'nav.analisi': 'Analisi', 'nav.storico': 'Storico', 'nav.logout': 'Esci',

        'common.loading': 'Caricamento in corso…', 'common.saving': 'Salvataggio…', 'common.save': 'Salva', 'common.cancel': 'Annulla',
        'common.create': 'Crea', 'common.delete': 'Elimina', 'common.close': 'Chiudi', 'common.search': 'Cerca',
        'common.complete': 'Completa', 'common.back': 'Indietro', 'common.edit': 'Modifica',
        'common.deleteConfirmPrefix': 'Elimina "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Errore nel caricamento. Riprova più tardi.',
        'common.errorLoadingStats': 'Errore nel caricamento delle statistiche.',
        'common.errorLoading': 'Errore nel caricamento.',
        'common.errorApi': 'Errore API: {status}',
        'common.showPassword': 'Mostra password', 'common.hidePassword': 'Nascondi password',
        'common.statistics': 'Statistiche',
        'common.days': 'Giorni', 'common.searchMembers': 'Cerca membri…',

        'status.completato': 'Completato', 'status.inCorso': 'In corso', 'status.daIniziare': 'Da iniziare',
        'status.inPausa': 'In pausa', 'status.bloccato': 'Bloccato', 'status.daFare': 'Da fare',
        'status.tuttiGliStati': 'Tutti gli stati',

        'priority.bassa': 'Bassa', 'priority.media': 'Media', 'priority.alta': 'Alta', 'priority.urgente': 'Urgente',
        'priority.tutteLePriorita': 'Tutte le priorità',

        'category.sviluppo': 'Sviluppo', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Testing', 'category.analisi': 'Analisi', 'category.devops': 'DevOps',
        'category.sicurezza': 'Sicurezza',

        'role.capoprogetto': 'Capoprogetto', 'role.dipendente': 'Dipendente', 'role.amministratore': 'Amministratore',

        'field.nome': 'Nome', 'field.descrizione': 'Descrizione', 'field.stato': 'Stato',
        'field.teamLeader': 'Team Leader', 'field.membriTeam': 'Membri del team', 'field.titolo': 'Titolo',
        'field.priorita': 'Priorità', 'field.tipologia': 'Tipologia', 'field.tempoStimatoMin': 'Tempo stimato (min)',
        'field.tempoStimato': 'Tempo stimato',
        'field.scadenza': 'Scadenza', 'field.assegnatoA': 'Assegnato a', 'field.email': 'Email',
        'field.password': 'Password', 'field.area': 'Area', 'field.progetto': 'Progetto', 'field.data': 'Data',
        'field.task': 'Task',

        'login.title': 'Accedi', 'login.submit': 'Accedi', 'login.forgotPassword': 'Password dimenticata?',
        'login.emailPlaceholder': 'email@azienda.it', 'login.errorInvalid': 'Email o password non corretti.',
        'login.errorGeneric': "Errore durante l'accesso.",

        'forgot.title': 'Password dimenticata', 'forgot.submit': 'Invia richiesta',
        'forgot.backToLogin': 'Torna al login',
        'forgot.devTitle': 'Modalità sviluppo — nessuna email è stata inviata',
        'forgot.devDesc': 'In un ambiente reale questo link ti sarebbe arrivato via email. Per ora, eccolo qui:',
        'forgot.errorGeneric': 'Errore durante la richiesta.',

        'reset.title': 'Imposta una nuova password', 'reset.newPassword': 'Nuova password',
        'reset.confirmPassword': 'Conferma nuova password', 'reset.placeholderMin8': 'Almeno 8 caratteri',
        'reset.placeholderRepeat': 'Ripeti la password', 'reset.submit': 'Reimposta password',
        'reset.errorMismatch': 'Le due password non coincidono.',
        'reset.errorNoToken': 'Link di reset non valido: token mancante.',
        'reset.errorInvalidLink': 'Link di reset non valido o incompleto: manca il token.',
        'reset.errorGeneric': 'Errore durante il reset della password.',
        'reset.successToast': 'Password reimpostata con successo. Accedi con la nuova password.',

        'dashboard.titleAdmin': 'Dashboard', 'dashboard.subtitleAdmin': 'Panoramica completa del sistema',
        'dashboard.titleUser': 'Le Mie Attività', 'dashboard.subtitleUser': 'Benvenuto, {name}',
        'dashboard.statTodo': 'Da fare', 'dashboard.statInProgress': 'In corso',
        'dashboard.statCompleted': 'Completato', 'dashboard.statOverdue': 'Attività in ritardo',
        'dashboard.statTotalUsers': 'Totale utenti', 'dashboard.statActiveProjects': 'Progetti attivi',
        'dashboard.statActiveTasks': 'Attività attive', 'dashboard.myActiveTasks': 'Le mie attività attive',
        'dashboard.recentTasks': 'Attività recente', 'dashboard.activeProjects': 'Progetti Attivi',
        'dashboard.noRecentTasks': 'Nessuna attività registrata.', 'dashboard.noActiveProjects': 'Nessun progetto attivo.',
        'dashboard.noActiveTasksNow': 'Nessuna attività attiva al momento.',
        'dashboard.tasksCompletedCaption': '{completed} / {total} attività completate',
        'dashboard.progressAria': 'Avanzamento {percent}%',
        'dashboard.completeError': "Errore durante il completamento dell'attività.",
        'dashboard.completeSuccess': 'Attività completata',

        'progetti.title': 'Progetti', 'progetti.subtitle': 'Gestione progetti e monitoraggio avanzamento',
        'progetti.newProject': 'Crea nuovo progetto', 'progetti.searchAria': 'Cerca progetti', 'progetti.listAria': 'Lista progetti',
        'progetti.noneFound': 'Nessun progetto trovato.', 'progetti.avanzamento': 'Avanzamento',
        'progetti.attivita': 'Attività', 'progetti.team': 'Team', 'progetti.manager': 'Manager',
        'progetti.membriCount': '{count} membri',
        'progetti.namePlaceholder': 'Nome del progetto', 'progetti.descPlaceholder': 'Descrizione del progetto',
        'progetti.createdSuccess': 'Progetto creato con successo', 'progetti.createError': 'Errore durante la creazione.',
        'progetti.dateRangeError': 'La data di inizio non può essere successiva alla data di fine.',

        'progettiDett.editTitle': 'Modifica progetto',
        'progettiDett.deleteConfirmDesc': "Le associazioni ai dipendenti (incluso il capoprogetto) verranno eliminate insieme al progetto. Se sono presenti attività collegate, rimuovile prima di procedere. Questa azione è irreversibile.",
        'progettiDett.membri': 'Membri', 'progettiDett.dataInizio': 'Data inizio', 'progettiDett.dataFine': 'Data fine',
        'progettiDett.creatoIl': 'Creato il', 'progettiDett.aggiornatoIl': 'Aggiornato il',
        'progettiDett.newTask': 'Crea nuova attività', 'progettiDett.searchAria': 'Cerca attività',
        'progettiDett.taskListAria': 'Lista attività del progetto',
        'progettiDett.noTasksFound': 'Nessuna attività trovata.', 'progettiDett.editTaskTitle': 'Modifica attività',
        'progettiDett.newTaskModalTitle': 'Crea nuova attività',
        'progettiDett.deleteTaskDesc': "L'attività verrà eliminata definitivamente.",
        'progettiDett.notFound': 'Progetto non trovato.', 'progettiDett.noProjectSpecified': 'Nessun progetto specificato.',
        'progettiDett.updatedSuccess': 'Progetto aggiornato con successo', 'progettiDett.updateError': 'Errore durante il salvataggio.',
        'progettiDett.deletedSuccess': 'Progetto eliminato con successo', 'progettiDett.deleteError': "Errore durante l'eliminazione.",
        'progettiDett.taskCreatedSuccess': 'Attività creata con successo', 'progettiDett.taskUpdatedSuccess': 'Attività aggiornata con successo',
        'progettiDett.taskDeletedSuccess': 'Attività eliminata con successo',

        'attivita.title': 'Attività', 'attivita.subtitle': 'Gestione e monitoraggio attività',
        'attivita.newTask': 'Crea nuova attività', 'attivita.searchAria': 'Cerca attività',
        'attivita.noneFound': 'Nessuna attività trovata.', 'attivita.editAria': 'Modifica attività',
        'attivita.deleteAria': 'Elimina attività', 'attivita.listAria': 'Lista attività',
        'attivita.taskCreatedSuccess': 'Attività creata con successo', 'attivita.taskUpdatedSuccess': 'Attività aggiornata con successo',
        'attivita.taskDeletedSuccess': 'Attività eliminata con successo',
        'attivita.negativeEstimateError': 'Il tempo stimato non può essere negativo.',

        'attivitaDett.notFound': 'Attività non trovata.', 'attivitaDett.noneSpecified': 'Nessuna attività specificata.',
        'attivitaDett.progettoEAssegnatari': 'Progetto e assegnatari', 'attivitaDett.assegnatari': 'Assegnatari',
        'attivitaDett.nessunAssegnatario': 'Nessun assegnatario.', 'attivitaDett.creataDa': 'Creata da',
        'attivitaDett.dateETempi': 'Date e tempi', 'attivitaDett.tempoStimato': 'Tempo stimato',
        'attivitaDett.tempoEffettivo': 'Tempo effettivo', 'attivitaDett.creataIl': 'Creata il',
        'attivitaDett.descrizione': 'Descrizione', 'attivitaDett.storicoEsecuzioni': 'Storico esecuzioni',
        'attivitaDett.nessunaEsecuzione': 'Nessuna esecuzione registrata.',
        'attivitaDett.updatedSuccess': 'Attività aggiornata con successo', 'attivitaDett.updateError': 'Errore durante il salvataggio.',
        'attivitaDett.deletedSuccess': 'Attività eliminata con successo', 'attivitaDett.deleteError': "Errore durante l'eliminazione.",

        'utenti.title': 'Utenti', 'utenti.subtitle': 'Gestione utenti e permessi', 'utenti.newUser': 'Crea nuovo utente',
        'utenti.searchAria': 'Cerca utenti', 'utenti.listAria': 'Lista utenti', 'utenti.noneFound': 'Nessun utente trovato.',
        'utenti.createModalTitle': 'Crea nuovo utente', 'utenti.editModalTitle': 'Modifica utente',
        'utenti.namePlaceholder': 'Nome completo', 'utenti.passwordPlaceholder': 'Password iniziale',
        'utenti.areaPlaceholder': 'es. Sviluppo',
        'utenti.isAdminLabel': 'Amministratore (accesso completo a tutti i progetti e alla gestione utenti)',
        'utenti.deleteConfirmDesc': "L'utente verrà rimosso definitivamente dal sistema.",
        'utenti.attivitaAttive': 'Attività attive', 'utenti.completate': 'Completate', 'utenti.deleteAria': 'Elimina utente',
        'utenti.createdSuccess': 'Utente creato con successo', 'utenti.updatedSuccess': 'Utente aggiornato con successo',
        'utenti.deletedSuccess': 'Utente eliminato con successo', 'utenti.saveError': 'Errore durante il salvataggio.',
        'utenti.deleteError': "Errore durante l'eliminazione.",

        'report.titleAnalytics': 'Analisi', 'report.subtitleAnalytics': 'Analisi e reportistica avanzata',
        'report.titlePersonal': 'Storico', 'report.subtitlePersonal': 'Tieni traccia di ciò che hai fatto ogni giorno',
        'report.newEntry': 'Nuova voce', 'report.editEntry': 'Modifica voce', 'report.export': 'Esporta', 'report.project': 'Progetto',
        'report.statsAria': 'Statistiche report', 'report.entriesAria': 'Voci di report',
        'report.distribuzionePerStato': 'Distribuzione per Stato', 'report.distribuzionePerPriorita': 'Distribuzione per Priorità',
        'report.attivitaPerProgetto': 'Attività per Progetto', 'report.noDataAvailable': 'Nessun dato disponibile.',
        'report.noProjectAvailable': 'Nessun progetto disponibile.', 'report.noEntriesRegistered': 'Nessuna voce di report registrata.',
        'report.taskSelectDefault': 'Seleziona un task',
        'report.descPlaceholder': 'Descrivi cosa hai fatto oggi: attività completate, riunioni, problemi affrontati…',
        'report.timeWorked': 'Tempo lavorato', 'report.hours': 'ore', 'report.minutes': 'minuti',
        'report.totalTasks': 'Totale attività', 'report.completionRate': 'Tasso completamento',
        'report.estimatedTime': 'Tempo stimato', 'report.actualTime': 'Tempo effettivo', 'report.completate': 'Completate',
        'report.inCorso': 'In corso', 'report.totale': 'Totale', 'report.bloccate': 'Bloccate', 'report.inPausa': 'In pausa',
        'report.savedSuccess': 'Voce di report salvata con successo', 'report.saveError': 'Errore durante il salvataggio della voce di report.'
    },

    en: {
        'lang.change': 'Change language',
        'lang.name.it': 'Italian', 'lang.name.en': 'English', 'lang.name.fr': 'French',
        'lang.name.de': 'German', 'lang.name.es': 'Spanish', 'lang.name.sq': 'Albanian', 'lang.name.nl': 'Dutch',

        'nav.ariaLabel': 'Main navigation',
        'nav.dashboard': 'Dashboard', 'nav.progetti': 'Projects', 'nav.attivita': 'Tasks',
        'nav.utenti': 'Users', 'nav.analisi': 'Analytics', 'nav.storico': 'History', 'nav.logout': 'Log out',

        'common.loading': 'Loading…', 'common.saving': 'Saving…', 'common.save': 'Save', 'common.cancel': 'Cancel',
        'common.create': 'Create', 'common.delete': 'Delete', 'common.close': 'Close', 'common.search': 'Search',
        'common.complete': 'Complete', 'common.back': 'Back', 'common.edit': 'Edit',
        'common.deleteConfirmPrefix': 'Delete "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Error while loading. Please try again later.',
        'common.errorLoadingStats': 'Error while loading statistics.',
        'common.errorLoading': 'Error while loading.',
        'common.errorApi': 'API error: {status}',
        'common.showPassword': 'Show password', 'common.hidePassword': 'Hide password',
        'common.statistics': 'Statistics',
        'common.days': 'Days', 'common.searchMembers': 'Search members…',

        'status.completato': 'Completed', 'status.inCorso': 'In progress', 'status.daIniziare': 'To do',
        'status.inPausa': 'On hold', 'status.bloccato': 'Blocked', 'status.daFare': 'To do',
        'status.tuttiGliStati': 'All statuses',

        'priority.bassa': 'Low', 'priority.media': 'Medium', 'priority.alta': 'High', 'priority.urgente': 'Urgent',
        'priority.tutteLePriorita': 'All priorities',

        'category.sviluppo': 'Development', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Testing', 'category.analisi': 'Analysis', 'category.devops': 'DevOps',
        'category.sicurezza': 'Security',

        'role.capoprogetto': 'Team Leader', 'role.dipendente': 'Employee', 'role.amministratore': 'Administrator',

        'field.nome': 'Name', 'field.descrizione': 'Description', 'field.stato': 'Status',
        'field.teamLeader': 'Team Leader', 'field.membriTeam': 'Team members', 'field.titolo': 'Title',
        'field.priorita': 'Priority', 'field.tipologia': 'Category', 'field.tempoStimatoMin': 'Estimated time (min)',
        'field.tempoStimato': 'Estimated time',
        'field.scadenza': 'Due date', 'field.assegnatoA': 'Assigned to', 'field.email': 'Email',
        'field.password': 'Password', 'field.area': 'Department', 'field.progetto': 'Project', 'field.data': 'Date',
        'field.task': 'Task',

        'login.title': 'Sign in', 'login.submit': 'Sign in', 'login.forgotPassword': 'Forgot your password?',
        'login.emailPlaceholder': 'email@company.com', 'login.errorInvalid': 'Incorrect email or password.',
        'login.errorGeneric': 'An error occurred while signing in.',

        'forgot.title': 'Forgot password', 'forgot.submit': 'Send request',
        'forgot.backToLogin': 'Back to sign in',
        'forgot.devTitle': 'Development mode — no email was sent',
        'forgot.devDesc': 'In a real environment this link would have been sent to you by email. For now, here it is:',
        'forgot.errorGeneric': 'An error occurred while sending the request.',

        'reset.title': 'Set a new password', 'reset.newPassword': 'New password',
        'reset.confirmPassword': 'Confirm new password', 'reset.placeholderMin8': 'At least 8 characters',
        'reset.placeholderRepeat': 'Repeat the password', 'reset.submit': 'Reset password',
        'reset.errorMismatch': "The two passwords don't match.",
        'reset.errorNoToken': 'Invalid reset link: missing token.',
        'reset.errorInvalidLink': 'Invalid or incomplete reset link: token missing.',
        'reset.errorGeneric': 'An error occurred while resetting the password.',
        'reset.successToast': 'Password reset successfully. Sign in with your new password.',

        'dashboard.titleAdmin': 'Dashboard', 'dashboard.subtitleAdmin': 'Complete system overview',
        'dashboard.titleUser': 'My Tasks', 'dashboard.subtitleUser': 'Welcome, {name}',
        'dashboard.statTodo': 'To do', 'dashboard.statInProgress': 'In progress',
        'dashboard.statCompleted': 'Completed', 'dashboard.statOverdue': 'Overdue tasks',
        'dashboard.statTotalUsers': 'Total users', 'dashboard.statActiveProjects': 'Active projects',
        'dashboard.statActiveTasks': 'Active tasks', 'dashboard.myActiveTasks': 'My active tasks',
        'dashboard.recentTasks': 'Recent activity', 'dashboard.activeProjects': 'Active Projects',
        'dashboard.noRecentTasks': 'No tasks recorded.', 'dashboard.noActiveProjects': 'No active projects.',
        'dashboard.noActiveTasksNow': 'No active tasks at the moment.',
        'dashboard.tasksCompletedCaption': '{completed} / {total} tasks completed',
        'dashboard.progressAria': 'Progress {percent}%',
        'dashboard.completeError': 'An error occurred while completing the task.',
        'dashboard.completeSuccess': 'Task completed',

        'progetti.title': 'Projects', 'progetti.subtitle': 'Project management and progress tracking',
        'progetti.newProject': 'Create new project', 'progetti.searchAria': 'Search projects', 'progetti.listAria': 'Project list',
        'progetti.noneFound': 'No projects found.', 'progetti.avanzamento': 'Progress',
        'progetti.attivita': 'Tasks', 'progetti.team': 'Team', 'progetti.manager': 'Manager',
        'progetti.membriCount': '{count} members',
        'progetti.namePlaceholder': 'Project name', 'progetti.descPlaceholder': 'Project description',
        'progetti.createdSuccess': 'Project created successfully', 'progetti.createError': 'An error occurred while creating the project.',
        'progetti.dateRangeError': 'The start date cannot be later than the end date.',

        'progettiDett.editTitle': 'Edit project',
        'progettiDett.deleteConfirmDesc': "Employee associations (including the team leader) will be deleted together with the project. If there are tasks still linked to it, remove them first. This action cannot be undone.",
        'progettiDett.membri': 'Members', 'progettiDett.dataInizio': 'Start date', 'progettiDett.dataFine': 'End date',
        'progettiDett.creatoIl': 'Created on', 'progettiDett.aggiornatoIl': 'Updated on',
        'progettiDett.newTask': 'Create new task', 'progettiDett.searchAria': 'Search tasks',
        'progettiDett.taskListAria': 'Project task list',
        'progettiDett.noTasksFound': 'No tasks found.', 'progettiDett.editTaskTitle': 'Edit task',
        'progettiDett.newTaskModalTitle': 'Create new task',
        'progettiDett.deleteTaskDesc': 'The task will be permanently deleted.',
        'progettiDett.notFound': 'Project not found.', 'progettiDett.noProjectSpecified': 'No project specified.',
        'progettiDett.updatedSuccess': 'Project updated successfully', 'progettiDett.updateError': 'An error occurred while saving.',
        'progettiDett.deletedSuccess': 'Project deleted successfully', 'progettiDett.deleteError': 'An error occurred while deleting.',
        'progettiDett.taskCreatedSuccess': 'Task created successfully', 'progettiDett.taskUpdatedSuccess': 'Task updated successfully',
        'progettiDett.taskDeletedSuccess': 'Task deleted successfully',

        'attivita.title': 'Tasks', 'attivita.subtitle': 'Task management and tracking',
        'attivita.newTask': 'Create new task', 'attivita.searchAria': 'Search tasks',
        'attivita.noneFound': 'No tasks found.', 'attivita.editAria': 'Edit task',
        'attivita.deleteAria': 'Delete task', 'attivita.listAria': 'Task list',
        'attivita.taskCreatedSuccess': 'Task created successfully', 'attivita.taskUpdatedSuccess': 'Task updated successfully',
        'attivita.taskDeletedSuccess': 'Task deleted successfully',
        'attivita.negativeEstimateError': 'The estimated time cannot be negative.',

        'attivitaDett.notFound': 'Task not found.', 'attivitaDett.noneSpecified': 'No task specified.',
        'attivitaDett.progettoEAssegnatari': 'Project and assignees', 'attivitaDett.assegnatari': 'Assignees',
        'attivitaDett.nessunAssegnatario': 'No assignee.', 'attivitaDett.creataDa': 'Created by',
        'attivitaDett.dateETempi': 'Dates and time', 'attivitaDett.tempoStimato': 'Estimated time',
        'attivitaDett.tempoEffettivo': 'Actual time', 'attivitaDett.creataIl': 'Created on',
        'attivitaDett.descrizione': 'Description', 'attivitaDett.storicoEsecuzioni': 'Work history',
        'attivitaDett.nessunaEsecuzione': 'No work logged yet.',
        'attivitaDett.updatedSuccess': 'Task updated successfully', 'attivitaDett.updateError': 'An error occurred while saving.',
        'attivitaDett.deletedSuccess': 'Task deleted successfully', 'attivitaDett.deleteError': 'An error occurred while deleting.',

        'utenti.title': 'Users', 'utenti.subtitle': 'User and permission management', 'utenti.newUser': 'Create new user',
        'utenti.searchAria': 'Search users', 'utenti.listAria': 'User list', 'utenti.noneFound': 'No users found.',
        'utenti.createModalTitle': 'Create new user', 'utenti.editModalTitle': 'Edit user',
        'utenti.namePlaceholder': 'Full name', 'utenti.passwordPlaceholder': 'Initial password',
        'utenti.areaPlaceholder': 'e.g. Development',
        'utenti.isAdminLabel': 'Administrator (full access to all projects and user management)',
        'utenti.deleteConfirmDesc': 'The user will be permanently removed from the system.',
        'utenti.attivitaAttive': 'Active tasks', 'utenti.completate': 'Completed', 'utenti.deleteAria': 'Delete user',
        'utenti.createdSuccess': 'User created successfully', 'utenti.updatedSuccess': 'User updated successfully',
        'utenti.deletedSuccess': 'User deleted successfully', 'utenti.saveError': 'An error occurred while saving.',
        'utenti.deleteError': 'An error occurred while deleting.',

        'report.titleAnalytics': 'Analytics', 'report.subtitleAnalytics': 'Advanced analytics and reporting',
        'report.titlePersonal': 'History', 'report.subtitlePersonal': 'Keep track of what you did each day',
        'report.newEntry': 'New entry', 'report.editEntry': 'Edit entry', 'report.export': 'Export', 'report.project': 'Project',
        'report.statsAria': 'Report statistics', 'report.entriesAria': 'Report entries',
        'report.distribuzionePerStato': 'Distribution by Status', 'report.distribuzionePerPriorita': 'Distribution by Priority',
        'report.attivitaPerProgetto': 'Tasks per Project', 'report.noDataAvailable': 'No data available.',
        'report.noProjectAvailable': 'No project available.', 'report.noEntriesRegistered': 'No report entries recorded.',
        'report.taskSelectDefault': 'Select a task',
        'report.descPlaceholder': 'Describe what you did today: completed tasks, meetings, issues faced…',
        'report.timeWorked': 'Time worked', 'report.hours': 'hours', 'report.minutes': 'minutes',
        'report.totalTasks': 'Total tasks', 'report.completionRate': 'Completion rate',
        'report.estimatedTime': 'Estimated time', 'report.actualTime': 'Actual time', 'report.completate': 'Completed',
        'report.inCorso': 'In progress', 'report.totale': 'Total', 'report.bloccate': 'Blocked', 'report.inPausa': 'On hold',
        'report.savedSuccess': 'Report entry saved successfully', 'report.saveError': 'An error occurred while saving the report entry.'
    },

    fr: {
        'lang.change': 'Changer de langue',
        'lang.name.it': 'Italien', 'lang.name.en': 'Anglais', 'lang.name.fr': 'Français',
        'lang.name.de': 'Allemand', 'lang.name.es': 'Espagnol', 'lang.name.sq': 'Albanais', 'lang.name.nl': 'Néerlandais',

        'nav.ariaLabel': 'Navigation principale',
        'nav.dashboard': 'Tableau de bord', 'nav.progetti': 'Projets', 'nav.attivita': 'Tâches',
        'nav.utenti': 'Utilisateurs', 'nav.analisi': 'Analyses', 'nav.storico': 'Historique', 'nav.logout': 'Déconnexion',

        'common.loading': 'Chargement en cours…', 'common.saving': 'Enregistrement…', 'common.save': 'Enregistrer', 'common.cancel': 'Annuler',
        'common.create': 'Créer', 'common.delete': 'Supprimer', 'common.close': 'Fermer', 'common.search': 'Rechercher',
        'common.complete': 'Terminer', 'common.back': 'Retour', 'common.edit': 'Modifier',
        'common.deleteConfirmPrefix': 'Supprimer "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Erreur de chargement. Veuillez réessayer plus tard.',
        'common.errorLoadingStats': 'Erreur lors du chargement des statistiques.',
        'common.errorLoading': 'Erreur de chargement.',
        'common.errorApi': 'Erreur API : {status}',
        'common.showPassword': 'Afficher le mot de passe', 'common.hidePassword': 'Masquer le mot de passe',
        'common.statistics': 'Statistiques',
        'common.days': 'Jours', 'common.searchMembers': 'Rechercher des membres…',

        'status.completato': 'Terminé', 'status.inCorso': 'En cours', 'status.daIniziare': 'À commencer',
        'status.inPausa': 'En pause', 'status.bloccato': 'Bloqué', 'status.daFare': 'À faire',
        'status.tuttiGliStati': 'Tous les statuts',

        'priority.bassa': 'Basse', 'priority.media': 'Moyenne', 'priority.alta': 'Haute', 'priority.urgente': 'Urgente',
        'priority.tutteLePriorita': 'Toutes les priorités',

        'category.sviluppo': 'Développement', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Tests', 'category.analisi': 'Analyse', 'category.devops': 'DevOps',
        'category.sicurezza': 'Sécurité',

        'role.capoprogetto': 'Chef de projet', 'role.dipendente': 'Employé', 'role.amministratore': 'Administrateur',

        'field.nome': 'Nom', 'field.descrizione': 'Description', 'field.stato': 'Statut',
        'field.teamLeader': 'Chef de projet', 'field.membriTeam': "Membres de l'équipe", 'field.titolo': 'Titre',
        'field.priorita': 'Priorité', 'field.tipologia': 'Catégorie', 'field.tempoStimatoMin': 'Temps estimé (min)',
        'field.tempoStimato': 'Temps estimé',
        'field.scadenza': 'Échéance', 'field.assegnatoA': 'Assigné à', 'field.email': 'Email',
        'field.password': 'Mot de passe', 'field.area': 'Service', 'field.progetto': 'Projet', 'field.data': 'Date',
        'field.task': 'Tâche',

        'login.title': 'Connexion', 'login.submit': 'Se connecter', 'login.forgotPassword': 'Mot de passe oublié ?',
        'login.emailPlaceholder': 'email@entreprise.fr', 'login.errorInvalid': 'Email ou mot de passe incorrect.',
        'login.errorGeneric': 'Une erreur est survenue lors de la connexion.',

        'forgot.title': 'Mot de passe oublié', 'forgot.submit': 'Envoyer la demande',
        'forgot.backToLogin': 'Retour à la connexion',
        'forgot.devTitle': "Mode développement — aucun email n'a été envoyé",
        'forgot.devDesc': 'Dans un environnement réel, ce lien vous aurait été envoyé par email. Pour le moment, le voici :',
        'forgot.errorGeneric': "Une erreur est survenue lors de l'envoi de la demande.",

        'reset.title': 'Définir un nouveau mot de passe', 'reset.newPassword': 'Nouveau mot de passe',
        'reset.confirmPassword': 'Confirmer le nouveau mot de passe', 'reset.placeholderMin8': 'Au moins 8 caractères',
        'reset.placeholderRepeat': 'Répétez le mot de passe', 'reset.submit': 'Réinitialiser le mot de passe',
        'reset.errorMismatch': 'Les deux mots de passe ne correspondent pas.',
        'reset.errorNoToken': 'Lien de réinitialisation invalide : jeton manquant.',
        'reset.errorInvalidLink': 'Lien de réinitialisation invalide ou incomplet : jeton manquant.',
        'reset.errorGeneric': 'Une erreur est survenue lors de la réinitialisation du mot de passe.',
        'reset.successToast': 'Mot de passe réinitialisé avec succès. Connectez-vous avec le nouveau mot de passe.',

        'dashboard.titleAdmin': 'Tableau de bord', 'dashboard.subtitleAdmin': 'Vue d\'ensemble complète du système',
        'dashboard.titleUser': 'Mes tâches', 'dashboard.subtitleUser': 'Bienvenue, {name}',
        'dashboard.statTodo': 'À faire', 'dashboard.statInProgress': 'En cours',
        'dashboard.statCompleted': 'Terminé', 'dashboard.statOverdue': 'Tâches en retard',
        'dashboard.statTotalUsers': "Total d'utilisateurs", 'dashboard.statActiveProjects': 'Projets actifs',
        'dashboard.statActiveTasks': 'Tâches actives', 'dashboard.myActiveTasks': 'Mes tâches actives',
        'dashboard.recentTasks': 'Activité récente', 'dashboard.activeProjects': 'Projets actifs',
        'dashboard.noRecentTasks': 'Aucune tâche enregistrée.', 'dashboard.noActiveProjects': 'Aucun projet actif.',
        'dashboard.noActiveTasksNow': "Aucune tâche active pour le moment.",
        'dashboard.tasksCompletedCaption': '{completed} / {total} tâches terminées',
        'dashboard.progressAria': 'Avancement {percent}%',
        'dashboard.completeError': "Une erreur est survenue lors de la finalisation de la tâche.",
        'dashboard.completeSuccess': 'Tâche terminée',

        'progetti.title': 'Projets', 'progetti.subtitle': "Gestion des projets et suivi de l'avancement",
        'progetti.newProject': 'Créer un nouveau projet', 'progetti.searchAria': 'Rechercher des projets', 'progetti.listAria': 'Liste des projets',
        'progetti.noneFound': 'Aucun projet trouvé.', 'progetti.avanzamento': 'Avancement',
        'progetti.attivita': 'Tâches', 'progetti.team': 'Équipe', 'progetti.manager': 'Responsable',
        'progetti.membriCount': '{count} membres',
        'progetti.namePlaceholder': 'Nom du projet', 'progetti.descPlaceholder': 'Description du projet',
        'progetti.createdSuccess': 'Projet créé avec succès', 'progetti.createError': 'Une erreur est survenue lors de la création.',
        'progetti.dateRangeError': "La date de début ne peut pas être postérieure à la date de fin.",

        'progettiDett.editTitle': 'Modifier le projet',
        'progettiDett.deleteConfirmDesc': "Les associations avec les employés (y compris le chef de projet) seront supprimées avec le projet. S'il reste des tâches liées, supprimez-les d'abord. Cette action est irréversible.",
        'progettiDett.membri': 'Membres', 'progettiDett.dataInizio': 'Date de début', 'progettiDett.dataFine': 'Date de fin',
        'progettiDett.creatoIl': 'Créé le', 'progettiDett.aggiornatoIl': 'Mis à jour le',
        'progettiDett.newTask': 'Créer une nouvelle tâche', 'progettiDett.searchAria': 'Rechercher des tâches',
        'progettiDett.taskListAria': 'Liste des tâches du projet',
        'progettiDett.noTasksFound': 'Aucune tâche trouvée.', 'progettiDett.editTaskTitle': 'Modifier la tâche',
        'progettiDett.newTaskModalTitle': 'Créer une nouvelle tâche',
        'progettiDett.deleteTaskDesc': 'La tâche sera définitivement supprimée.',
        'progettiDett.notFound': 'Projet introuvable.', 'progettiDett.noProjectSpecified': 'Aucun projet spécifié.',
        'progettiDett.updatedSuccess': 'Projet mis à jour avec succès', 'progettiDett.updateError': "Une erreur est survenue lors de l'enregistrement.",
        'progettiDett.deletedSuccess': 'Projet supprimé avec succès', 'progettiDett.deleteError': 'Une erreur est survenue lors de la suppression.',
        'progettiDett.taskCreatedSuccess': 'Tâche créée avec succès', 'progettiDett.taskUpdatedSuccess': 'Tâche mise à jour avec succès',
        'progettiDett.taskDeletedSuccess': 'Tâche supprimée avec succès',

        'attivita.title': 'Tâches', 'attivita.subtitle': 'Gestion et suivi des tâches',
        'attivita.newTask': 'Créer une nouvelle tâche', 'attivita.searchAria': 'Rechercher des tâches',
        'attivita.noneFound': 'Aucune tâche trouvée.', 'attivita.editAria': 'Modifier la tâche',
        'attivita.deleteAria': 'Supprimer la tâche', 'attivita.listAria': 'Liste des tâches',
        'attivita.taskCreatedSuccess': 'Tâche créée avec succès', 'attivita.taskUpdatedSuccess': 'Tâche mise à jour avec succès',
        'attivita.taskDeletedSuccess': 'Tâche supprimée avec succès',
        'attivita.negativeEstimateError': "Le temps estimé ne peut pas être négatif.",

        'attivitaDett.notFound': 'Tâche introuvable.', 'attivitaDett.noneSpecified': 'Aucune tâche spécifiée.',
        'attivitaDett.progettoEAssegnatari': 'Projet et assignés', 'attivitaDett.assegnatari': 'Assignés',
        'attivitaDett.nessunAssegnatario': 'Aucun assigné.', 'attivitaDett.creataDa': 'Créée par',
        'attivitaDett.dateETempi': 'Dates et temps', 'attivitaDett.tempoStimato': 'Temps estimé',
        'attivitaDett.tempoEffettivo': 'Temps réel', 'attivitaDett.creataIl': 'Créée le',
        'attivitaDett.descrizione': 'Description', 'attivitaDett.storicoEsecuzioni': "Historique d'exécution",
        'attivitaDett.nessunaEsecuzione': 'Aucune exécution enregistrée.',
        'attivitaDett.updatedSuccess': 'Tâche mise à jour avec succès', 'attivitaDett.updateError': "Une erreur est survenue lors de l'enregistrement.",
        'attivitaDett.deletedSuccess': 'Tâche supprimée avec succès', 'attivitaDett.deleteError': 'Une erreur est survenue lors de la suppression.',

        'utenti.title': 'Utilisateurs', 'utenti.subtitle': 'Gestion des utilisateurs et des permissions', 'utenti.newUser': 'Créer un nouvel utilisateur',
        'utenti.searchAria': 'Rechercher des utilisateurs', 'utenti.listAria': 'Liste des utilisateurs', 'utenti.noneFound': 'Aucun utilisateur trouvé.',
        'utenti.createModalTitle': 'Créer un nouvel utilisateur', 'utenti.editModalTitle': "Modifier l'utilisateur",
        'utenti.namePlaceholder': 'Nom complet', 'utenti.passwordPlaceholder': 'Mot de passe initial',
        'utenti.areaPlaceholder': 'ex. Développement',
        'utenti.isAdminLabel': 'Administrateur (accès complet à tous les projets et à la gestion des utilisateurs)',
        'utenti.deleteConfirmDesc': "L'utilisateur sera définitivement supprimé du système.",
        'utenti.attivitaAttive': 'Tâches actives', 'utenti.completate': 'Terminées', 'utenti.deleteAria': "Supprimer l'utilisateur",
        'utenti.createdSuccess': 'Utilisateur créé avec succès', 'utenti.updatedSuccess': 'Utilisateur mis à jour avec succès',
        'utenti.deletedSuccess': 'Utilisateur supprimé avec succès', 'utenti.saveError': "Une erreur est survenue lors de l'enregistrement.",
        'utenti.deleteError': 'Une erreur est survenue lors de la suppression.',

        'report.titleAnalytics': 'Analyses', 'report.subtitleAnalytics': 'Analyses et rapports avancés',
        'report.titlePersonal': 'Historique', 'report.subtitlePersonal': 'Suivez ce que vous avez fait chaque jour',
        'report.newEntry': 'Nouvelle entrée', 'report.editEntry': "Modifier l'entrée", 'report.export': 'Exporter', 'report.project': 'Projet',
        'report.statsAria': 'Statistiques du rapport', 'report.entriesAria': 'Entrées du rapport',
        'report.distribuzionePerStato': 'Répartition par statut', 'report.distribuzionePerPriorita': 'Répartition par priorité',
        'report.attivitaPerProgetto': 'Tâches par projet', 'report.noDataAvailable': 'Aucune donnée disponible.',
        'report.noProjectAvailable': 'Aucun projet disponible.', 'report.noEntriesRegistered': 'Aucune entrée de rapport enregistrée.',
        'report.taskSelectDefault': 'Sélectionnez une tâche',
        'report.descPlaceholder': "Décrivez ce que vous avez fait aujourd'hui : tâches terminées, réunions, problèmes rencontrés…",
        'report.timeWorked': 'Temps travaillé', 'report.hours': 'heures', 'report.minutes': 'minutes',
        'report.totalTasks': 'Total des tâches', 'report.completionRate': 'Taux de complétion',
        'report.estimatedTime': 'Temps estimé', 'report.actualTime': 'Temps réel', 'report.completate': 'Terminées',
        'report.inCorso': 'En cours', 'report.totale': 'Total', 'report.bloccate': 'Bloquées', 'report.inPausa': 'En pause',
        'report.savedSuccess': 'Entrée de rapport enregistrée avec succès', 'report.saveError': "Une erreur est survenue lors de l'enregistrement de l'entrée de rapport."
    },

    de: {
        'lang.change': 'Sprache ändern',
        'lang.name.it': 'Italienisch', 'lang.name.en': 'Englisch', 'lang.name.fr': 'Französisch',
        'lang.name.de': 'Deutsch', 'lang.name.es': 'Spanisch', 'lang.name.sq': 'Albanisch', 'lang.name.nl': 'Niederländisch',

        'nav.ariaLabel': 'Hauptnavigation',
        'nav.dashboard': 'Dashboard', 'nav.progetti': 'Projekte', 'nav.attivita': 'Aufgaben',
        'nav.utenti': 'Benutzer', 'nav.analisi': 'Analysen', 'nav.storico': 'Verlauf', 'nav.logout': 'Abmelden',

        'common.loading': 'Wird geladen…', 'common.saving': 'Wird gespeichert…', 'common.save': 'Speichern', 'common.cancel': 'Abbrechen',
        'common.create': 'Erstellen', 'common.delete': 'Löschen', 'common.close': 'Schließen', 'common.search': 'Suchen',
        'common.complete': 'Abschließen', 'common.back': 'Zurück', 'common.edit': 'Bearbeiten',
        'common.deleteConfirmPrefix': 'Löschen "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Fehler beim Laden. Bitte versuchen Sie es später erneut.',
        'common.errorLoadingStats': 'Fehler beim Laden der Statistiken.',
        'common.errorLoading': 'Fehler beim Laden.',
        'common.errorApi': 'API-Fehler: {status}',
        'common.showPassword': 'Passwort anzeigen', 'common.hidePassword': 'Passwort verbergen',
        'common.statistics': 'Statistiken',
        'common.days': 'Tage', 'common.searchMembers': 'Mitglieder suchen…',

        'status.completato': 'Abgeschlossen', 'status.inCorso': 'In Bearbeitung', 'status.daIniziare': 'Zu erledigen',
        'status.inPausa': 'Pausiert', 'status.bloccato': 'Blockiert', 'status.daFare': 'Zu erledigen',
        'status.tuttiGliStati': 'Alle Status',

        'priority.bassa': 'Niedrig', 'priority.media': 'Mittel', 'priority.alta': 'Hoch', 'priority.urgente': 'Dringend',
        'priority.tutteLePriorita': 'Alle Prioritäten',

        'category.sviluppo': 'Entwicklung', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Testing', 'category.analisi': 'Analyse', 'category.devops': 'DevOps',
        'category.sicurezza': 'Sicherheit',

        'role.capoprogetto': 'Teamleiter', 'role.dipendente': 'Mitarbeiter', 'role.amministratore': 'Administrator',

        'field.nome': 'Name', 'field.descrizione': 'Beschreibung', 'field.stato': 'Status',
        'field.teamLeader': 'Teamleiter', 'field.membriTeam': 'Teammitglieder', 'field.titolo': 'Titel',
        'field.priorita': 'Priorität', 'field.tipologia': 'Kategorie', 'field.tempoStimatoMin': 'Geschätzte Zeit (Min.)',
        'field.tempoStimato': 'Geschätzte Zeit',
        'field.scadenza': 'Fälligkeitsdatum', 'field.assegnatoA': 'Zugewiesen an', 'field.email': 'E-Mail',
        'field.password': 'Passwort', 'field.area': 'Abteilung', 'field.progetto': 'Projekt', 'field.data': 'Datum',
        'field.task': 'Aufgabe',

        'login.title': 'Anmelden', 'login.submit': 'Anmelden', 'login.forgotPassword': 'Passwort vergessen?',
        'login.emailPlaceholder': 'email@firma.de', 'login.errorInvalid': 'E-Mail oder Passwort falsch.',
        'login.errorGeneric': 'Beim Anmelden ist ein Fehler aufgetreten.',

        'forgot.title': 'Passwort vergessen', 'forgot.submit': 'Anfrage senden',
        'forgot.backToLogin': 'Zurück zur Anmeldung',
        'forgot.devTitle': 'Entwicklungsmodus — es wurde keine E-Mail gesendet',
        'forgot.devDesc': 'In einer echten Umgebung wäre dieser Link per E-Mail an Sie gesendet worden. Hier ist er vorerst:',
        'forgot.errorGeneric': 'Beim Senden der Anfrage ist ein Fehler aufgetreten.',

        'reset.title': 'Neues Passwort festlegen', 'reset.newPassword': 'Neues Passwort',
        'reset.confirmPassword': 'Neues Passwort bestätigen', 'reset.placeholderMin8': 'Mindestens 8 Zeichen',
        'reset.placeholderRepeat': 'Passwort wiederholen', 'reset.submit': 'Passwort zurücksetzen',
        'reset.errorMismatch': 'Die beiden Passwörter stimmen nicht überein.',
        'reset.errorNoToken': 'Ungültiger Reset-Link: Token fehlt.',
        'reset.errorInvalidLink': 'Ungültiger oder unvollständiger Reset-Link: Token fehlt.',
        'reset.errorGeneric': 'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.',
        'reset.successToast': 'Passwort erfolgreich zurückgesetzt. Melden Sie sich mit dem neuen Passwort an.',

        'dashboard.titleAdmin': 'Dashboard', 'dashboard.subtitleAdmin': 'Vollständige Systemübersicht',
        'dashboard.titleUser': 'Meine Aufgaben', 'dashboard.subtitleUser': 'Willkommen, {name}',
        'dashboard.statTodo': 'Zu erledigen', 'dashboard.statInProgress': 'In Bearbeitung',
        'dashboard.statCompleted': 'Abgeschlossen', 'dashboard.statOverdue': 'Überfällige Aufgaben',
        'dashboard.statTotalUsers': 'Benutzer insgesamt', 'dashboard.statActiveProjects': 'Aktive Projekte',
        'dashboard.statActiveTasks': 'Aktive Aufgaben', 'dashboard.myActiveTasks': 'Meine aktiven Aufgaben',
        'dashboard.recentTasks': 'Letzte Aktivität', 'dashboard.activeProjects': 'Aktive Projekte',
        'dashboard.noRecentTasks': 'Keine Aufgaben erfasst.', 'dashboard.noActiveProjects': 'Keine aktiven Projekte.',
        'dashboard.noActiveTasksNow': 'Derzeit keine aktiven Aufgaben.',
        'dashboard.tasksCompletedCaption': '{completed} / {total} Aufgaben abgeschlossen',
        'dashboard.progressAria': 'Fortschritt {percent}%',
        'dashboard.completeError': 'Beim Abschließen der Aufgabe ist ein Fehler aufgetreten.',
        'dashboard.completeSuccess': 'Aufgabe abgeschlossen',

        'progetti.title': 'Projekte', 'progetti.subtitle': 'Projektverwaltung und Fortschrittsüberwachung',
        'progetti.newProject': 'Neues Projekt erstellen', 'progetti.searchAria': 'Projekte suchen', 'progetti.listAria': 'Projektliste',
        'progetti.noneFound': 'Keine Projekte gefunden.', 'progetti.avanzamento': 'Fortschritt',
        'progetti.attivita': 'Aufgaben', 'progetti.team': 'Team', 'progetti.manager': 'Verantwortlicher',
        'progetti.membriCount': '{count} Mitglieder',
        'progetti.namePlaceholder': 'Projektname', 'progetti.descPlaceholder': 'Projektbeschreibung',
        'progetti.createdSuccess': 'Projekt erfolgreich erstellt', 'progetti.createError': 'Beim Erstellen ist ein Fehler aufgetreten.',
        'progetti.dateRangeError': 'Das Startdatum darf nicht nach dem Enddatum liegen.',

        'progettiDett.editTitle': 'Projekt bearbeiten',
        'progettiDett.deleteConfirmDesc': 'Die Zuordnungen zu Mitarbeitern (einschließlich des Teamleiters) werden zusammen mit dem Projekt gelöscht. Falls noch Aufgaben verknüpft sind, entfernen Sie diese zuerst. Diese Aktion kann nicht rückgängig gemacht werden.',
        'progettiDett.membri': 'Mitglieder', 'progettiDett.dataInizio': 'Startdatum', 'progettiDett.dataFine': 'Enddatum',
        'progettiDett.creatoIl': 'Erstellt am', 'progettiDett.aggiornatoIl': 'Aktualisiert am',
        'progettiDett.newTask': 'Neue Aufgabe erstellen', 'progettiDett.searchAria': 'Aufgaben suchen',
        'progettiDett.taskListAria': 'Aufgabenliste des Projekts',
        'progettiDett.noTasksFound': 'Keine Aufgaben gefunden.', 'progettiDett.editTaskTitle': 'Aufgabe bearbeiten',
        'progettiDett.newTaskModalTitle': 'Neue Aufgabe erstellen',
        'progettiDett.deleteTaskDesc': 'Die Aufgabe wird endgültig gelöscht.',
        'progettiDett.notFound': 'Projekt nicht gefunden.', 'progettiDett.noProjectSpecified': 'Kein Projekt angegeben.',
        'progettiDett.updatedSuccess': 'Projekt erfolgreich aktualisiert', 'progettiDett.updateError': 'Beim Speichern ist ein Fehler aufgetreten.',
        'progettiDett.deletedSuccess': 'Projekt erfolgreich gelöscht', 'progettiDett.deleteError': 'Beim Löschen ist ein Fehler aufgetreten.',
        'progettiDett.taskCreatedSuccess': 'Aufgabe erfolgreich erstellt', 'progettiDett.taskUpdatedSuccess': 'Aufgabe erfolgreich aktualisiert',
        'progettiDett.taskDeletedSuccess': 'Aufgabe erfolgreich gelöscht',

        'attivita.title': 'Aufgaben', 'attivita.subtitle': 'Aufgabenverwaltung und -überwachung',
        'attivita.newTask': 'Neue Aufgabe erstellen', 'attivita.searchAria': 'Aufgaben suchen',
        'attivita.noneFound': 'Keine Aufgaben gefunden.', 'attivita.editAria': 'Aufgabe bearbeiten',
        'attivita.deleteAria': 'Aufgabe löschen', 'attivita.listAria': 'Aufgabenliste',
        'attivita.taskCreatedSuccess': 'Aufgabe erfolgreich erstellt', 'attivita.taskUpdatedSuccess': 'Aufgabe erfolgreich aktualisiert',
        'attivita.taskDeletedSuccess': 'Aufgabe erfolgreich gelöscht',
        'attivita.negativeEstimateError': 'Die geschätzte Zeit darf nicht negativ sein.',

        'attivitaDett.notFound': 'Aufgabe nicht gefunden.', 'attivitaDett.noneSpecified': 'Keine Aufgabe angegeben.',
        'attivitaDett.progettoEAssegnatari': 'Projekt und Zuständige', 'attivitaDett.assegnatari': 'Zuständige',
        'attivitaDett.nessunAssegnatario': 'Kein Zuständiger.', 'attivitaDett.creataDa': 'Erstellt von',
        'attivitaDett.dateETempi': 'Termine und Zeiten', 'attivitaDett.tempoStimato': 'Geschätzte Zeit',
        'attivitaDett.tempoEffettivo': 'Tatsächliche Zeit', 'attivitaDett.creataIl': 'Erstellt am',
        'attivitaDett.descrizione': 'Beschreibung', 'attivitaDett.storicoEsecuzioni': 'Arbeitsverlauf',
        'attivitaDett.nessunaEsecuzione': 'Noch keine Arbeit erfasst.',
        'attivitaDett.updatedSuccess': 'Aufgabe erfolgreich aktualisiert', 'attivitaDett.updateError': 'Beim Speichern ist ein Fehler aufgetreten.',
        'attivitaDett.deletedSuccess': 'Aufgabe erfolgreich gelöscht', 'attivitaDett.deleteError': 'Beim Löschen ist ein Fehler aufgetreten.',

        'utenti.title': 'Benutzer', 'utenti.subtitle': 'Benutzer- und Rechteverwaltung', 'utenti.newUser': 'Neuen Benutzer erstellen',
        'utenti.searchAria': 'Benutzer suchen', 'utenti.listAria': 'Benutzerliste', 'utenti.noneFound': 'Keine Benutzer gefunden.',
        'utenti.createModalTitle': 'Neuen Benutzer erstellen', 'utenti.editModalTitle': 'Benutzer bearbeiten',
        'utenti.namePlaceholder': 'Vollständiger Name', 'utenti.passwordPlaceholder': 'Initiales Passwort',
        'utenti.areaPlaceholder': 'z. B. Entwicklung',
        'utenti.isAdminLabel': 'Administrator (vollständiger Zugriff auf alle Projekte und die Benutzerverwaltung)',
        'utenti.deleteConfirmDesc': 'Der Benutzer wird dauerhaft aus dem System entfernt.',
        'utenti.attivitaAttive': 'Aktive Aufgaben', 'utenti.completate': 'Abgeschlossen', 'utenti.deleteAria': 'Benutzer löschen',
        'utenti.createdSuccess': 'Benutzer erfolgreich erstellt', 'utenti.updatedSuccess': 'Benutzer erfolgreich aktualisiert',
        'utenti.deletedSuccess': 'Benutzer erfolgreich gelöscht', 'utenti.saveError': 'Beim Speichern ist ein Fehler aufgetreten.',
        'utenti.deleteError': 'Beim Löschen ist ein Fehler aufgetreten.',

        'report.titleAnalytics': 'Analysen', 'report.subtitleAnalytics': 'Erweiterte Analysen und Berichte',
        'report.titlePersonal': 'Verlauf', 'report.subtitlePersonal': 'Behalten Sie im Blick, was Sie jeden Tag getan haben',
        'report.newEntry': 'Neuer Eintrag', 'report.editEntry': 'Eintrag bearbeiten', 'report.export': 'Exportieren', 'report.project': 'Projekt',
        'report.statsAria': 'Berichtsstatistiken', 'report.entriesAria': 'Berichtseinträge',
        'report.distribuzionePerStato': 'Verteilung nach Status', 'report.distribuzionePerPriorita': 'Verteilung nach Priorität',
        'report.attivitaPerProgetto': 'Aufgaben pro Projekt', 'report.noDataAvailable': 'Keine Daten verfügbar.',
        'report.noProjectAvailable': 'Kein Projekt verfügbar.', 'report.noEntriesRegistered': 'Keine Berichtseinträge erfasst.',
        'report.taskSelectDefault': 'Aufgabe auswählen',
        'report.descPlaceholder': 'Beschreiben Sie, was Sie heute getan haben: erledigte Aufgaben, Meetings, aufgetretene Probleme…',
        'report.timeWorked': 'Gearbeitete Zeit', 'report.hours': 'Stunden', 'report.minutes': 'Minuten',
        'report.totalTasks': 'Aufgaben insgesamt', 'report.completionRate': 'Abschlussquote',
        'report.estimatedTime': 'Geschätzte Zeit', 'report.actualTime': 'Tatsächliche Zeit', 'report.completate': 'Abgeschlossen',
        'report.inCorso': 'In Bearbeitung', 'report.totale': 'Gesamt', 'report.bloccate': 'Blockiert', 'report.inPausa': 'Pausiert',
        'report.savedSuccess': 'Berichtseintrag erfolgreich gespeichert', 'report.saveError': 'Beim Speichern des Berichtseintrags ist ein Fehler aufgetreten.'
    },

    es: {
        'lang.change': 'Cambiar idioma',
        'lang.name.it': 'Italiano', 'lang.name.en': 'Inglés', 'lang.name.fr': 'Francés',
        'lang.name.de': 'Alemán', 'lang.name.es': 'Español', 'lang.name.sq': 'Albanés', 'lang.name.nl': 'Neerlandés',

        'nav.ariaLabel': 'Navegación principal',
        'nav.dashboard': 'Panel', 'nav.progetti': 'Proyectos', 'nav.attivita': 'Tareas',
        'nav.utenti': 'Usuarios', 'nav.analisi': 'Análisis', 'nav.storico': 'Historial', 'nav.logout': 'Cerrar sesión',

        'common.loading': 'Cargando…', 'common.saving': 'Guardando…', 'common.save': 'Guardar', 'common.cancel': 'Cancelar',
        'common.create': 'Crear', 'common.delete': 'Eliminar', 'common.close': 'Cerrar', 'common.search': 'Buscar',
        'common.complete': 'Completar', 'common.back': 'Atrás', 'common.edit': 'Editar',
        'common.deleteConfirmPrefix': 'Eliminar "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Error al cargar. Inténtalo de nuevo más tarde.',
        'common.errorLoadingStats': 'Error al cargar las estadísticas.',
        'common.errorLoading': 'Error al cargar.',
        'common.errorApi': 'Error de la API: {status}',
        'common.showPassword': 'Mostrar contraseña', 'common.hidePassword': 'Ocultar contraseña',
        'common.statistics': 'Estadísticas',
        'common.days': 'Días', 'common.searchMembers': 'Buscar miembros…',

        'status.completato': 'Completado', 'status.inCorso': 'En curso', 'status.daIniziare': 'Por iniciar',
        'status.inPausa': 'En pausa', 'status.bloccato': 'Bloqueado', 'status.daFare': 'Por hacer',
        'status.tuttiGliStati': 'Todos los estados',

        'priority.bassa': 'Baja', 'priority.media': 'Media', 'priority.alta': 'Alta', 'priority.urgente': 'Urgente',
        'priority.tutteLePriorita': 'Todas las prioridades',

        'category.sviluppo': 'Desarrollo', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Pruebas', 'category.analisi': 'Análisis', 'category.devops': 'DevOps',
        'category.sicurezza': 'Seguridad',

        'role.capoprogetto': 'Jefe de proyecto', 'role.dipendente': 'Empleado', 'role.amministratore': 'Administrador',

        'field.nome': 'Nombre', 'field.descrizione': 'Descripción', 'field.stato': 'Estado',
        'field.teamLeader': 'Jefe de proyecto', 'field.membriTeam': 'Miembros del equipo', 'field.titolo': 'Título',
        'field.priorita': 'Prioridad', 'field.tipologia': 'Categoría', 'field.tempoStimatoMin': 'Tiempo estimado (min)',
        'field.tempoStimato': 'Tiempo estimado',
        'field.scadenza': 'Fecha límite', 'field.assegnatoA': 'Asignado a', 'field.email': 'Correo electrónico',
        'field.password': 'Contraseña', 'field.area': 'Departamento', 'field.progetto': 'Proyecto', 'field.data': 'Fecha',
        'field.task': 'Tarea',

        'login.title': 'Iniciar sesión', 'login.submit': 'Iniciar sesión', 'login.forgotPassword': '¿Olvidaste tu contraseña?',
        'login.emailPlaceholder': 'email@empresa.es', 'login.errorInvalid': 'Correo o contraseña incorrectos.',
        'login.errorGeneric': 'Se produjo un error al iniciar sesión.',

        'forgot.title': 'Contraseña olvidada', 'forgot.submit': 'Enviar solicitud',
        'forgot.backToLogin': 'Volver al inicio de sesión',
        'forgot.devTitle': 'Modo desarrollo — no se envió ningún correo',
        'forgot.devDesc': 'En un entorno real, este enlace te habría llegado por correo electrónico. Por ahora, aquí está:',
        'forgot.errorGeneric': 'Se produjo un error al enviar la solicitud.',

        'reset.title': 'Establecer una nueva contraseña', 'reset.newPassword': 'Nueva contraseña',
        'reset.confirmPassword': 'Confirmar nueva contraseña', 'reset.placeholderMin8': 'Al menos 8 caracteres',
        'reset.placeholderRepeat': 'Repite la contraseña', 'reset.submit': 'Restablecer contraseña',
        'reset.errorMismatch': 'Las dos contraseñas no coinciden.',
        'reset.errorNoToken': 'Enlace de restablecimiento no válido: falta el token.',
        'reset.errorInvalidLink': 'Enlace de restablecimiento no válido o incompleto: falta el token.',
        'reset.errorGeneric': 'Se produjo un error al restablecer la contraseña.',
        'reset.successToast': 'Contraseña restablecida correctamente. Inicia sesión con la nueva contraseña.',

        'dashboard.titleAdmin': 'Panel', 'dashboard.subtitleAdmin': 'Vista general completa del sistema',
        'dashboard.titleUser': 'Mis tareas', 'dashboard.subtitleUser': 'Bienvenido, {name}',
        'dashboard.statTodo': 'Por hacer', 'dashboard.statInProgress': 'En curso',
        'dashboard.statCompleted': 'Completado', 'dashboard.statOverdue': 'Tareas atrasadas',
        'dashboard.statTotalUsers': 'Total de usuarios', 'dashboard.statActiveProjects': 'Proyectos activos',
        'dashboard.statActiveTasks': 'Tareas activas', 'dashboard.myActiveTasks': 'Mis tareas activas',
        'dashboard.recentTasks': 'Actividad reciente', 'dashboard.activeProjects': 'Proyectos activos',
        'dashboard.noRecentTasks': 'No hay tareas registradas.', 'dashboard.noActiveProjects': 'No hay proyectos activos.',
        'dashboard.noActiveTasksNow': 'No hay tareas activas en este momento.',
        'dashboard.tasksCompletedCaption': '{completed} / {total} tareas completadas',
        'dashboard.progressAria': 'Progreso {percent}%',
        'dashboard.completeError': 'Se produjo un error al completar la tarea.',
        'dashboard.completeSuccess': 'Tarea completada',

        'progetti.title': 'Proyectos', 'progetti.subtitle': 'Gestión de proyectos y seguimiento del avance',
        'progetti.newProject': 'Crear nuevo proyecto', 'progetti.searchAria': 'Buscar proyectos', 'progetti.listAria': 'Lista de proyectos',
        'progetti.noneFound': 'No se encontraron proyectos.', 'progetti.avanzamento': 'Avance',
        'progetti.attivita': 'Tareas', 'progetti.team': 'Equipo', 'progetti.manager': 'Responsable',
        'progetti.membriCount': '{count} miembros',
        'progetti.namePlaceholder': 'Nombre del proyecto', 'progetti.descPlaceholder': 'Descripción del proyecto',
        'progetti.createdSuccess': 'Proyecto creado correctamente', 'progetti.createError': 'Se produjo un error al crear el proyecto.',
        'progetti.dateRangeError': 'La fecha de inicio no puede ser posterior a la fecha de fin.',

        'progettiDett.editTitle': 'Editar proyecto',
        'progettiDett.deleteConfirmDesc': 'Las asociaciones con empleados (incluido el jefe de proyecto) se eliminarán junto con el proyecto. Si todavía hay tareas vinculadas, elimínalas primero. Esta acción es irreversible.',
        'progettiDett.membri': 'Miembros', 'progettiDett.dataInizio': 'Fecha de inicio', 'progettiDett.dataFine': 'Fecha de fin',
        'progettiDett.creatoIl': 'Creado el', 'progettiDett.aggiornatoIl': 'Actualizado el',
        'progettiDett.newTask': 'Crear nueva tarea', 'progettiDett.searchAria': 'Buscar tareas',
        'progettiDett.taskListAria': 'Lista de tareas del proyecto',
        'progettiDett.noTasksFound': 'No se encontraron tareas.', 'progettiDett.editTaskTitle': 'Editar tarea',
        'progettiDett.newTaskModalTitle': 'Crear nueva tarea',
        'progettiDett.deleteTaskDesc': 'La tarea se eliminará definitivamente.',
        'progettiDett.notFound': 'Proyecto no encontrado.', 'progettiDett.noProjectSpecified': 'No se especificó ningún proyecto.',
        'progettiDett.updatedSuccess': 'Proyecto actualizado correctamente', 'progettiDett.updateError': 'Se produjo un error al guardar.',
        'progettiDett.deletedSuccess': 'Proyecto eliminado correctamente', 'progettiDett.deleteError': 'Se produjo un error al eliminar.',
        'progettiDett.taskCreatedSuccess': 'Tarea creada correctamente', 'progettiDett.taskUpdatedSuccess': 'Tarea actualizada correctamente',
        'progettiDett.taskDeletedSuccess': 'Tarea eliminada correctamente',

        'attivita.title': 'Tareas', 'attivita.subtitle': 'Gestión y seguimiento de tareas',
        'attivita.newTask': 'Crear nueva tarea', 'attivita.searchAria': 'Buscar tareas',
        'attivita.noneFound': 'No se encontraron tareas.', 'attivita.editAria': 'Editar tarea',
        'attivita.deleteAria': 'Eliminar tarea', 'attivita.listAria': 'Lista de tareas',
        'attivita.taskCreatedSuccess': 'Tarea creada correctamente', 'attivita.taskUpdatedSuccess': 'Tarea actualizada correctamente',
        'attivita.taskDeletedSuccess': 'Tarea eliminada correctamente',
        'attivita.negativeEstimateError': 'El tiempo estimado no puede ser negativo.',

        'attivitaDett.notFound': 'Tarea no encontrada.', 'attivitaDett.noneSpecified': 'No se especificó ninguna tarea.',
        'attivitaDett.progettoEAssegnatari': 'Proyecto y asignados', 'attivitaDett.assegnatari': 'Asignados',
        'attivitaDett.nessunAssegnatario': 'Sin asignados.', 'attivitaDett.creataDa': 'Creada por',
        'attivitaDett.dateETempi': 'Fechas y tiempos', 'attivitaDett.tempoStimato': 'Tiempo estimado',
        'attivitaDett.tempoEffettivo': 'Tiempo real', 'attivitaDett.creataIl': 'Creada el',
        'attivitaDett.descrizione': 'Descripción', 'attivitaDett.storicoEsecuzioni': 'Historial de ejecuciones',
        'attivitaDett.nessunaEsecuzione': 'Ninguna ejecución registrada.',
        'attivitaDett.updatedSuccess': 'Tarea actualizada correctamente', 'attivitaDett.updateError': 'Se produjo un error al guardar.',
        'attivitaDett.deletedSuccess': 'Tarea eliminada correctamente', 'attivitaDett.deleteError': 'Se produjo un error al eliminar.',

        'utenti.title': 'Usuarios', 'utenti.subtitle': 'Gestión de usuarios y permisos', 'utenti.newUser': 'Crear nuevo usuario',
        'utenti.searchAria': 'Buscar usuarios', 'utenti.listAria': 'Lista de usuarios', 'utenti.noneFound': 'No se encontraron usuarios.',
        'utenti.createModalTitle': 'Crear nuevo usuario', 'utenti.editModalTitle': 'Editar usuario',
        'utenti.namePlaceholder': 'Nombre completo', 'utenti.passwordPlaceholder': 'Contraseña inicial',
        'utenti.areaPlaceholder': 'ej. Desarrollo',
        'utenti.isAdminLabel': 'Administrador (acceso completo a todos los proyectos y a la gestión de usuarios)',
        'utenti.deleteConfirmDesc': 'El usuario se eliminará definitivamente del sistema.',
        'utenti.attivitaAttive': 'Tareas activas', 'utenti.completate': 'Completadas', 'utenti.deleteAria': 'Eliminar usuario',
        'utenti.createdSuccess': 'Usuario creado correctamente', 'utenti.updatedSuccess': 'Usuario actualizado correctamente',
        'utenti.deletedSuccess': 'Usuario eliminado correctamente', 'utenti.saveError': 'Se produjo un error al guardar.',
        'utenti.deleteError': 'Se produjo un error al eliminar.',

        'report.titleAnalytics': 'Análisis', 'report.subtitleAnalytics': 'Análisis e informes avanzados',
        'report.titlePersonal': 'Historial', 'report.subtitlePersonal': 'Lleva un registro de lo que hiciste cada día',
        'report.newEntry': 'Nueva entrada', 'report.editEntry': 'Editar entrada', 'report.export': 'Exportar', 'report.project': 'Proyecto',
        'report.statsAria': 'Estadísticas del informe', 'report.entriesAria': 'Entradas del informe',
        'report.distribuzionePerStato': 'Distribución por estado', 'report.distribuzionePerPriorita': 'Distribución por prioridad',
        'report.attivitaPerProgetto': 'Tareas por proyecto', 'report.noDataAvailable': 'No hay datos disponibles.',
        'report.noProjectAvailable': 'No hay proyectos disponibles.', 'report.noEntriesRegistered': 'No hay entradas de informe registradas.',
        'report.taskSelectDefault': 'Selecciona una tarea',
        'report.descPlaceholder': 'Describe lo que hiciste hoy: tareas completadas, reuniones, problemas encontrados…',
        'report.timeWorked': 'Tiempo trabajado', 'report.hours': 'horas', 'report.minutes': 'minutos',
        'report.totalTasks': 'Total de tareas', 'report.completionRate': 'Tasa de finalización',
        'report.estimatedTime': 'Tiempo estimado', 'report.actualTime': 'Tiempo real', 'report.completate': 'Completadas',
        'report.inCorso': 'En curso', 'report.totale': 'Total', 'report.bloccate': 'Bloqueadas', 'report.inPausa': 'En pausa',
        'report.savedSuccess': 'Entrada de informe guardada correctamente', 'report.saveError': 'Se produjo un error al guardar la entrada de informe.'
    },

    sq: {
        'lang.change': 'Ndrysho gjuhën',
        'lang.name.it': 'Italisht', 'lang.name.en': 'Anglisht', 'lang.name.fr': 'Frëngjisht',
        'lang.name.de': 'Gjermanisht', 'lang.name.es': 'Spanjisht', 'lang.name.sq': 'Shqip', 'lang.name.nl': 'Holandisht',

        'nav.ariaLabel': 'Navigimi kryesor',
        'nav.dashboard': 'Paneli', 'nav.progetti': 'Projektet', 'nav.attivita': 'Detyrat',
        'nav.utenti': 'Përdoruesit', 'nav.analisi': 'Analiza', 'nav.storico': 'Historiku', 'nav.logout': 'Dilni',

        'common.loading': 'Duke u ngarkuar…', 'common.saving': 'Duke ruajtur…', 'common.save': 'Ruaj', 'common.cancel': 'Anulo',
        'common.create': 'Krijo', 'common.delete': 'Fshi', 'common.close': 'Mbyll', 'common.search': 'Kërko',
        'common.complete': 'Përfundo', 'common.back': 'Kthehu', 'common.edit': 'Modifiko',
        'common.deleteConfirmPrefix': 'Fshi "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Gabim gjatë ngarkimit. Provo përsëri më vonë.',
        'common.errorLoadingStats': 'Gabim gjatë ngarkimit të statistikave.',
        'common.errorLoading': 'Gabim gjatë ngarkimit.',
        'common.errorApi': 'Gabim API: {status}',
        'common.showPassword': 'Shfaq fjalëkalimin', 'common.hidePassword': 'Fshih fjalëkalimin',
        'common.statistics': 'Statistika',
        'common.days': 'Ditë', 'common.searchMembers': 'Kërko anëtarë…',

        'status.completato': 'Përfunduar', 'status.inCorso': 'Në progres', 'status.daIniziare': 'Për të filluar',
        'status.inPausa': 'Në pauzë', 'status.bloccato': 'Bllokuar', 'status.daFare': 'Për të bërë',
        'status.tuttiGliStati': 'Të gjitha statuset',

        'priority.bassa': 'E ulët', 'priority.media': 'Mesatare', 'priority.alta': 'E lartë', 'priority.urgente': 'Urgjente',
        'priority.tutteLePriorita': 'Të gjitha prioritetet',

        'category.sviluppo': 'Zhvillim', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Testim', 'category.analisi': 'Analizë', 'category.devops': 'DevOps',
        'category.sicurezza': 'Siguri',

        'role.capoprogetto': 'Udhëheqës ekipi', 'role.dipendente': 'Punonjës', 'role.amministratore': 'Administrator',

        'field.nome': 'Emri', 'field.descrizione': 'Përshkrimi', 'field.stato': 'Statusi',
        'field.teamLeader': 'Udhëheqës ekipi', 'field.membriTeam': 'Anëtarët e ekipit', 'field.titolo': 'Titulli',
        'field.priorita': 'Prioriteti', 'field.tipologia': 'Kategoria', 'field.tempoStimatoMin': 'Koha e vlerësuar (min)',
        'field.tempoStimato': 'Koha e vlerësuar',
        'field.scadenza': 'Afati', 'field.assegnatoA': 'Caktuar tek', 'field.email': 'Email',
        'field.password': 'Fjalëkalimi', 'field.area': 'Departamenti', 'field.progetto': 'Projekti', 'field.data': 'Data',
        'field.task': 'Detyra',

        'login.title': 'Hyr', 'login.submit': 'Hyr', 'login.forgotPassword': 'Keni harruar fjalëkalimin?',
        'login.emailPlaceholder': 'email@kompania.al', 'login.errorInvalid': 'Email ose fjalëkalim i pasaktë.',
        'login.errorGeneric': 'Ndodhi një gabim gjatë hyrjes.',

        'forgot.title': 'Fjalëkalimi i harruar', 'forgot.submit': 'Dërgo kërkesën',
        'forgot.backToLogin': 'Kthehu te hyrja',
        'forgot.devTitle': 'Modaliteti i zhvillimit — nuk u dërgua asnjë email',
        'forgot.devDesc': 'Në një mjedis real, ky lidhje do t\'ju kishte ardhur me email. Për momentin, ja ku është:',
        'forgot.errorGeneric': 'Ndodhi një gabim gjatë dërgimit të kërkesës.',

        'reset.title': 'Vendos një fjalëkalim të ri', 'reset.newPassword': 'Fjalëkalimi i ri',
        'reset.confirmPassword': 'Konfirmo fjalëkalimin e ri', 'reset.placeholderMin8': 'Të paktën 8 karaktere',
        'reset.placeholderRepeat': 'Përsërit fjalëkalimin', 'reset.submit': 'Rivendos fjalëkalimin',
        'reset.errorMismatch': 'Dy fjalëkalimet nuk përputhen.',
        'reset.errorNoToken': 'Lidhje rivendosjeje jo e vlefshme: mungon shenja (token).',
        'reset.errorInvalidLink': 'Lidhje rivendosjeje jo e vlefshme ose e paplotë: mungon shenja (token).',
        'reset.errorGeneric': 'Ndodhi një gabim gjatë rivendosjes së fjalëkalimit.',
        'reset.successToast': 'Fjalëkalimi u rivendos me sukses. Hyni me fjalëkalimin e ri.',

        'dashboard.titleAdmin': 'Paneli', 'dashboard.subtitleAdmin': 'Pamje e plotë e sistemit',
        'dashboard.titleUser': 'Detyrat e mia', 'dashboard.subtitleUser': 'Mirë se erdhe, {name}',
        'dashboard.statTodo': 'Për të bërë', 'dashboard.statInProgress': 'Në progres',
        'dashboard.statCompleted': 'Përfunduar', 'dashboard.statOverdue': 'Detyra të vonuara',
        'dashboard.statTotalUsers': 'Përdorues gjithsej', 'dashboard.statActiveProjects': 'Projekte aktive',
        'dashboard.statActiveTasks': 'Detyra aktive', 'dashboard.myActiveTasks': 'Detyrat e mia aktive',
        'dashboard.recentTasks': 'Aktiviteti i fundit', 'dashboard.activeProjects': 'Projekte Aktive',
        'dashboard.noRecentTasks': 'Asnjë detyrë e regjistruar.', 'dashboard.noActiveProjects': 'Asnjë projekt aktiv.',
        'dashboard.noActiveTasksNow': 'Asnjë detyrë aktive për momentin.',
        'dashboard.tasksCompletedCaption': '{completed} / {total} detyra të përfunduara',
        'dashboard.progressAria': 'Përparimi {percent}%',
        'dashboard.completeError': 'Ndodhi një gabim gjatë përfundimit të detyrës.',
        'dashboard.completeSuccess': 'Detyra u përfundua',

        'progetti.title': 'Projektet', 'progetti.subtitle': 'Menaxhimi i projekteve dhe ndjekja e ecurisë',
        'progetti.newProject': 'Krijo projekt të ri', 'progetti.searchAria': 'Kërko projekte', 'progetti.listAria': 'Lista e projekteve',
        'progetti.noneFound': 'Nuk u gjet asnjë projekt.', 'progetti.avanzamento': 'Ecuria',
        'progetti.attivita': 'Detyrat', 'progetti.team': 'Ekipi', 'progetti.manager': 'Përgjegjësi',
        'progetti.membriCount': '{count} anëtarë',
        'progetti.namePlaceholder': 'Emri i projektit', 'progetti.descPlaceholder': 'Përshkrimi i projektit',
        'progetti.createdSuccess': 'Projekti u krijua me sukses', 'progetti.createError': 'Ndodhi një gabim gjatë krijimit.',
        'progetti.dateRangeError': 'Data e fillimit nuk mund të jetë pas datës së përfundimit.',

        'progettiDett.editTitle': 'Modifiko projektin',
        'progettiDett.deleteConfirmDesc': 'Lidhjet me punonjësit (përfshirë udhëheqësin e ekipit) do të fshihen së bashku me projektin. Nëse ka ende detyra të lidhura, hiqini ato së pari. Ky veprim është i pakthyeshëm.',
        'progettiDett.membri': 'Anëtarët', 'progettiDett.dataInizio': 'Data e fillimit', 'progettiDett.dataFine': 'Data e mbarimit',
        'progettiDett.creatoIl': 'Krijuar më', 'progettiDett.aggiornatoIl': 'Përditësuar më',
        'progettiDett.newTask': 'Krijo detyrë të re', 'progettiDett.searchAria': 'Kërko detyra',
        'progettiDett.taskListAria': 'Lista e detyrave të projektit',
        'progettiDett.noTasksFound': 'Nuk u gjet asnjë detyrë.', 'progettiDett.editTaskTitle': 'Modifiko detyrën',
        'progettiDett.newTaskModalTitle': 'Krijo detyrë të re',
        'progettiDett.deleteTaskDesc': 'Detyra do të fshihet përfundimisht.',
        'progettiDett.notFound': 'Projekti nuk u gjet.', 'progettiDett.noProjectSpecified': 'Nuk u specifikua asnjë projekt.',
        'progettiDett.updatedSuccess': 'Projekti u përditësua me sukses', 'progettiDett.updateError': 'Ndodhi një gabim gjatë ruajtjes.',
        'progettiDett.deletedSuccess': 'Projekti u fshi me sukses', 'progettiDett.deleteError': 'Ndodhi një gabim gjatë fshirjes.',
        'progettiDett.taskCreatedSuccess': 'Detyra u krijua me sukses', 'progettiDett.taskUpdatedSuccess': 'Detyra u përditësua me sukses',
        'progettiDett.taskDeletedSuccess': 'Detyra u fshi me sukses',

        'attivita.title': 'Detyrat', 'attivita.subtitle': 'Menaxhimi dhe ndjekja e detyrave',
        'attivita.newTask': 'Krijo detyrë të re', 'attivita.searchAria': 'Kërko detyra',
        'attivita.noneFound': 'Nuk u gjet asnjë detyrë.', 'attivita.editAria': 'Modifiko detyrën',
        'attivita.deleteAria': 'Fshi detyrën', 'attivita.listAria': 'Lista e detyrave',
        'attivita.taskCreatedSuccess': 'Detyra u krijua me sukses', 'attivita.taskUpdatedSuccess': 'Detyra u përditësua me sukses',
        'attivita.taskDeletedSuccess': 'Detyra u fshi me sukses',
        'attivita.negativeEstimateError': 'Koha e vlerësuar nuk mund të jetë negative.',

        'attivitaDett.notFound': 'Detyra nuk u gjet.', 'attivitaDett.noneSpecified': 'Nuk u specifikua asnjë detyrë.',
        'attivitaDett.progettoEAssegnatari': 'Projekti dhe të caktuarit', 'attivitaDett.assegnatari': 'Të caktuarit',
        'attivitaDett.nessunAssegnatario': 'Asnjë i caktuar.', 'attivitaDett.creataDa': 'Krijuar nga',
        'attivitaDett.dateETempi': 'Datat dhe koha', 'attivitaDett.tempoStimato': 'Koha e vlerësuar',
        'attivitaDett.tempoEffettivo': 'Koha reale', 'attivitaDett.creataIl': 'Krijuar më',
        'attivitaDett.descrizione': 'Përshkrimi', 'attivitaDett.storicoEsecuzioni': 'Historiku i punës',
        'attivitaDett.nessunaEsecuzione': 'Asnjë regjistrim pune ende.',
        'attivitaDett.updatedSuccess': 'Detyra u përditësua me sukses', 'attivitaDett.updateError': 'Ndodhi një gabim gjatë ruajtjes.',
        'attivitaDett.deletedSuccess': 'Detyra u fshi me sukses', 'attivitaDett.deleteError': 'Ndodhi një gabim gjatë fshirjes.',

        'utenti.title': 'Përdoruesit', 'utenti.subtitle': 'Menaxhimi i përdoruesve dhe i lejeve', 'utenti.newUser': 'Krijo përdorues të ri',
        'utenti.searchAria': 'Kërko përdorues', 'utenti.listAria': 'Lista e përdoruesve', 'utenti.noneFound': 'Nuk u gjet asnjë përdorues.',
        'utenti.createModalTitle': 'Krijo përdorues të ri', 'utenti.editModalTitle': 'Modifiko përdoruesin',
        'utenti.namePlaceholder': 'Emri i plotë', 'utenti.passwordPlaceholder': 'Fjalëkalimi fillestar',
        'utenti.areaPlaceholder': 'p.sh. Zhvillim',
        'utenti.isAdminLabel': 'Administrator (qasje e plotë në të gjitha projektet dhe në menaxhimin e përdoruesve)',
        'utenti.deleteConfirmDesc': 'Përdoruesi do të hiqet përfundimisht nga sistemi.',
        'utenti.attivitaAttive': 'Detyra aktive', 'utenti.completate': 'Të përfunduara', 'utenti.deleteAria': 'Fshi përdoruesin',
        'utenti.createdSuccess': 'Përdoruesi u krijua me sukses', 'utenti.updatedSuccess': 'Përdoruesi u përditësua me sukses',
        'utenti.deletedSuccess': 'Përdoruesi u fshi me sukses', 'utenti.saveError': 'Ndodhi një gabim gjatë ruajtjes.',
        'utenti.deleteError': 'Ndodhi një gabim gjatë fshirjes.',

        'report.titleAnalytics': 'Analiza', 'report.subtitleAnalytics': 'Analiza dhe raportime të avancuara',
        'report.titlePersonal': 'Historiku', 'report.subtitlePersonal': 'Mbaj gjurmët e asaj që bëre çdo ditë',
        'report.newEntry': 'Regjistrim i ri', 'report.editEntry': 'Modifiko regjistrimin', 'report.export': 'Eksporto', 'report.project': 'Projekti',
        'report.statsAria': 'Statistikat e raportit', 'report.entriesAria': 'Regjistrimet e raportit',
        'report.distribuzionePerStato': 'Shpërndarja sipas statusit', 'report.distribuzionePerPriorita': 'Shpërndarja sipas prioritetit',
        'report.attivitaPerProgetto': 'Detyrat për projekt', 'report.noDataAvailable': 'Nuk ka të dhëna të disponueshme.',
        'report.noProjectAvailable': 'Nuk ka projekt të disponueshëm.', 'report.noEntriesRegistered': 'Nuk ka regjistrime raporti të ruajtura.',
        'report.taskSelectDefault': 'Zgjidh një detyrë',
        'report.descPlaceholder': 'Përshkruaj çfarë bëre sot: detyra të përfunduara, takime, probleme të hasura…',
        'report.timeWorked': 'Koha e punuar', 'report.hours': 'orë', 'report.minutes': 'minuta',
        'report.totalTasks': 'Detyra gjithsej', 'report.completionRate': 'Shkalla e përfundimit',
        'report.estimatedTime': 'Koha e vlerësuar', 'report.actualTime': 'Koha reale', 'report.completate': 'Të përfunduara',
        'report.inCorso': 'Në progres', 'report.totale': 'Gjithsej', 'report.bloccate': 'Bllokuara', 'report.inPausa': 'Në pauzë',
        'report.savedSuccess': 'Regjistrimi i raportit u ruajt me sukses', 'report.saveError': 'Ndodhi një gabim gjatë ruajtjes së regjistrimit të raportit.'
    },

    nl: {
        'lang.change': 'Taal wijzigen',
        'lang.name.it': 'Italiaans', 'lang.name.en': 'Engels', 'lang.name.fr': 'Frans',
        'lang.name.de': 'Duits', 'lang.name.es': 'Spaans', 'lang.name.sq': 'Albanees', 'lang.name.nl': 'Nederlands',

        'nav.ariaLabel': 'Hoofdnavigatie',
        'nav.dashboard': 'Dashboard', 'nav.progetti': "Projecten", 'nav.attivita': 'Taken',
        'nav.utenti': 'Gebruikers', 'nav.analisi': 'Analyses', 'nav.storico': 'Geschiedenis', 'nav.logout': 'Afmelden',

        'common.loading': 'Bezig met laden…', 'common.saving': 'Bezig met opslaan…', 'common.save': 'Opslaan', 'common.cancel': 'Annuleren',
        'common.create': 'Aanmaken', 'common.delete': 'Verwijderen', 'common.close': 'Sluiten', 'common.search': 'Zoeken',
        'common.complete': 'Voltooien', 'common.back': 'Terug', 'common.edit': 'Bewerken',
        'common.deleteConfirmPrefix': 'Verwijderen "', 'common.deleteConfirmSuffix': '"?',
        'common.errorLoadingRetry': 'Fout bij het laden. Probeer het later opnieuw.',
        'common.errorLoadingStats': 'Fout bij het laden van de statistieken.',
        'common.errorLoading': 'Fout bij het laden.',
        'common.errorApi': 'API-fout: {status}',
        'common.showPassword': 'Wachtwoord tonen', 'common.hidePassword': 'Wachtwoord verbergen',
        'common.statistics': 'Statistieken',
        'common.days': 'Dagen', 'common.searchMembers': 'Leden zoeken…',

        'status.completato': 'Voltooid', 'status.inCorso': 'Bezig', 'status.daIniziare': 'Te starten',
        'status.inPausa': 'Gepauzeerd', 'status.bloccato': 'Geblokkeerd', 'status.daFare': 'Te doen',
        'status.tuttiGliStati': 'Alle statussen',

        'priority.bassa': 'Laag', 'priority.media': 'Gemiddeld', 'priority.alta': 'Hoog', 'priority.urgente': 'Urgent',
        'priority.tutteLePriorita': 'Alle prioriteiten',

        'category.sviluppo': 'Ontwikkeling', 'category.frontend': 'Frontend', 'category.backend': 'Backend',
        'category.testing': 'Testen', 'category.analisi': 'Analyse', 'category.devops': 'DevOps',
        'category.sicurezza': 'Beveiliging',

        'role.capoprogetto': 'Teamleider', 'role.dipendente': 'Medewerker', 'role.amministratore': 'Beheerder',

        'field.nome': 'Naam', 'field.descrizione': 'Beschrijving', 'field.stato': 'Status',
        'field.teamLeader': 'Teamleider', 'field.membriTeam': 'Teamleden', 'field.titolo': 'Titel',
        'field.priorita': 'Prioriteit', 'field.tipologia': 'Categorie', 'field.tempoStimatoMin': 'Geschatte tijd (min)',
        'field.tempoStimato': 'Geschatte tijd',
        'field.scadenza': 'Deadline', 'field.assegnatoA': 'Toegewezen aan', 'field.email': 'E-mail',
        'field.password': 'Wachtwoord', 'field.area': 'Afdeling', 'field.progetto': 'Project', 'field.data': 'Datum',
        'field.task': 'Taak',

        'login.title': 'Inloggen', 'login.submit': 'Inloggen', 'login.forgotPassword': 'Wachtwoord vergeten?',
        'login.emailPlaceholder': 'email@bedrijf.nl', 'login.errorInvalid': 'Onjuiste e-mail of wachtwoord.',
        'login.errorGeneric': 'Er is een fout opgetreden bij het inloggen.',

        'forgot.title': 'Wachtwoord vergeten', 'forgot.submit': 'Verzoek verzenden',
        'forgot.backToLogin': 'Terug naar inloggen',
        'forgot.devTitle': 'Ontwikkelmodus — er is geen e-mail verzonden',
        'forgot.devDesc': 'In een echte omgeving zou deze link per e-mail naar je zijn verzonden. Voorlopig staat hij hier:',
        'forgot.errorGeneric': 'Er is een fout opgetreden bij het verzenden van het verzoek.',

        'reset.title': 'Nieuw wachtwoord instellen', 'reset.newPassword': 'Nieuw wachtwoord',
        'reset.confirmPassword': 'Bevestig nieuw wachtwoord', 'reset.placeholderMin8': 'Minstens 8 tekens',
        'reset.placeholderRepeat': 'Herhaal het wachtwoord', 'reset.submit': 'Wachtwoord opnieuw instellen',
        'reset.errorMismatch': 'De twee wachtwoorden komen niet overeen.',
        'reset.errorNoToken': 'Ongeldige resetlink: token ontbreekt.',
        'reset.errorInvalidLink': 'Ongeldige of onvolledige resetlink: token ontbreekt.',
        'reset.errorGeneric': 'Er is een fout opgetreden bij het opnieuw instellen van het wachtwoord.',
        'reset.successToast': 'Wachtwoord succesvol opnieuw ingesteld. Log in met het nieuwe wachtwoord.',

        'dashboard.titleAdmin': 'Dashboard', 'dashboard.subtitleAdmin': 'Volledig systeemoverzicht',
        'dashboard.titleUser': 'Mijn taken', 'dashboard.subtitleUser': 'Welkom, {name}',
        'dashboard.statTodo': 'Te doen', 'dashboard.statInProgress': 'Bezig',
        'dashboard.statCompleted': 'Voltooid', 'dashboard.statOverdue': 'Achterstallige taken',
        'dashboard.statTotalUsers': 'Totaal aantal gebruikers', 'dashboard.statActiveProjects': 'Actieve projecten',
        'dashboard.statActiveTasks': 'Actieve taken', 'dashboard.myActiveTasks': 'Mijn actieve taken',
        'dashboard.recentTasks': 'Recente activiteit', 'dashboard.activeProjects': 'Actieve projecten',
        'dashboard.noRecentTasks': 'Geen taken geregistreerd.', 'dashboard.noActiveProjects': 'Geen actieve projecten.',
        'dashboard.noActiveTasksNow': 'Op dit moment geen actieve taken.',
        'dashboard.tasksCompletedCaption': '{completed} / {total} taken voltooid',
        'dashboard.progressAria': 'Voortgang {percent}%',
        'dashboard.completeError': 'Er is een fout opgetreden bij het voltooien van de taak.',
        'dashboard.completeSuccess': 'Taak voltooid',

        'progetti.title': 'Projecten', 'progetti.subtitle': 'Projectbeheer en voortgangsbewaking',
        'progetti.newProject': 'Nieuw project aanmaken', 'progetti.searchAria': 'Projecten zoeken', 'progetti.listAria': 'Projectenlijst',
        'progetti.noneFound': 'Geen projecten gevonden.', 'progetti.avanzamento': 'Voortgang',
        'progetti.attivita': 'Taken', 'progetti.team': 'Team', 'progetti.manager': 'Manager',
        'progetti.membriCount': '{count} leden',
        'progetti.namePlaceholder': 'Projectnaam', 'progetti.descPlaceholder': 'Projectbeschrijving',
        'progetti.createdSuccess': 'Project succesvol aangemaakt', 'progetti.createError': 'Er is een fout opgetreden bij het aanmaken.',
        'progetti.dateRangeError': 'De startdatum mag niet na de einddatum liggen.',

        'progettiDett.editTitle': 'Project bewerken',
        'progettiDett.deleteConfirmDesc': 'De koppelingen met medewerkers (inclusief de teamleider) worden samen met het project verwijderd. Als er nog taken aan gekoppeld zijn, verwijder deze dan eerst. Deze actie kan niet ongedaan worden gemaakt.',
        'progettiDett.membri': 'Leden', 'progettiDett.dataInizio': 'Startdatum', 'progettiDett.dataFine': 'Einddatum',
        'progettiDett.creatoIl': 'Aangemaakt op', 'progettiDett.aggiornatoIl': 'Bijgewerkt op',
        'progettiDett.newTask': 'Nieuwe taak aanmaken', 'progettiDett.searchAria': 'Taken zoeken',
        'progettiDett.taskListAria': 'Taaklijst van het project',
        'progettiDett.noTasksFound': 'Geen taken gevonden.', 'progettiDett.editTaskTitle': 'Taak bewerken',
        'progettiDett.newTaskModalTitle': 'Nieuwe taak aanmaken',
        'progettiDett.deleteTaskDesc': 'De taak wordt definitief verwijderd.',
        'progettiDett.notFound': 'Project niet gevonden.', 'progettiDett.noProjectSpecified': 'Geen project opgegeven.',
        'progettiDett.updatedSuccess': 'Project succesvol bijgewerkt', 'progettiDett.updateError': 'Er is een fout opgetreden bij het opslaan.',
        'progettiDett.deletedSuccess': 'Project succesvol verwijderd', 'progettiDett.deleteError': 'Er is een fout opgetreden bij het verwijderen.',
        'progettiDett.taskCreatedSuccess': 'Taak succesvol aangemaakt', 'progettiDett.taskUpdatedSuccess': 'Taak succesvol bijgewerkt',
        'progettiDett.taskDeletedSuccess': 'Taak succesvol verwijderd',

        'attivita.title': 'Taken', 'attivita.subtitle': 'Taakbeheer en -bewaking',
        'attivita.newTask': 'Nieuwe taak aanmaken', 'attivita.searchAria': 'Taken zoeken',
        'attivita.noneFound': 'Geen taken gevonden.', 'attivita.editAria': 'Taak bewerken',
        'attivita.deleteAria': 'Taak verwijderen', 'attivita.listAria': 'Takenlijst',
        'attivita.taskCreatedSuccess': 'Taak succesvol aangemaakt', 'attivita.taskUpdatedSuccess': 'Taak succesvol bijgewerkt',
        'attivita.taskDeletedSuccess': 'Taak succesvol verwijderd',
        'attivita.negativeEstimateError': 'De geschatte tijd mag niet negatief zijn.',

        'attivitaDett.notFound': 'Taak niet gevonden.', 'attivitaDett.noneSpecified': 'Geen taak opgegeven.',
        'attivitaDett.progettoEAssegnatari': 'Project en toegewezenen', 'attivitaDett.assegnatari': 'Toegewezenen',
        'attivitaDett.nessunAssegnatario': 'Geen toegewezene.', 'attivitaDett.creataDa': 'Aangemaakt door',
        'attivitaDett.dateETempi': 'Data en tijden', 'attivitaDett.tempoStimato': 'Geschatte tijd',
        'attivitaDett.tempoEffettivo': 'Werkelijke tijd', 'attivitaDett.creataIl': 'Aangemaakt op',
        'attivitaDett.descrizione': 'Beschrijving', 'attivitaDett.storicoEsecuzioni': 'Werkgeschiedenis',
        'attivitaDett.nessunaEsecuzione': 'Nog geen werk geregistreerd.',
        'attivitaDett.updatedSuccess': 'Taak succesvol bijgewerkt', 'attivitaDett.updateError': 'Er is een fout opgetreden bij het opslaan.',
        'attivitaDett.deletedSuccess': 'Taak succesvol verwijderd', 'attivitaDett.deleteError': 'Er is een fout opgetreden bij het verwijderen.',

        'utenti.title': 'Gebruikers', 'utenti.subtitle': 'Gebruikers- en rechtenbeheer', 'utenti.newUser': 'Nieuwe gebruiker aanmaken',
        'utenti.searchAria': 'Gebruikers zoeken', 'utenti.listAria': 'Gebruikerslijst', 'utenti.noneFound': 'Geen gebruikers gevonden.',
        'utenti.createModalTitle': 'Nieuwe gebruiker aanmaken', 'utenti.editModalTitle': 'Gebruiker bewerken',
        'utenti.namePlaceholder': 'Volledige naam', 'utenti.passwordPlaceholder': 'Initieel wachtwoord',
        'utenti.areaPlaceholder': 'bijv. Ontwikkeling',
        'utenti.isAdminLabel': 'Beheerder (volledige toegang tot alle projecten en gebruikersbeheer)',
        'utenti.deleteConfirmDesc': 'De gebruiker wordt permanent uit het systeem verwijderd.',
        'utenti.attivitaAttive': 'Actieve taken', 'utenti.completate': 'Voltooid', 'utenti.deleteAria': 'Gebruiker verwijderen',
        'utenti.createdSuccess': 'Gebruiker succesvol aangemaakt', 'utenti.updatedSuccess': 'Gebruiker succesvol bijgewerkt',
        'utenti.deletedSuccess': 'Gebruiker succesvol verwijderd', 'utenti.saveError': 'Er is een fout opgetreden bij het opslaan.',
        'utenti.deleteError': 'Er is een fout opgetreden bij het verwijderen.',

        'report.titleAnalytics': 'Analyses', 'report.subtitleAnalytics': 'Geavanceerde analyses en rapportages',
        'report.titlePersonal': 'Geschiedenis', 'report.subtitlePersonal': 'Houd bij wat je elke dag hebt gedaan',
        'report.newEntry': 'Nieuwe invoer', 'report.editEntry': 'Invoer bewerken', 'report.export': 'Exporteren', 'report.project': 'Project',
        'report.statsAria': 'Rapportstatistieken', 'report.entriesAria': 'Rapportinvoer',
        'report.distribuzionePerStato': 'Verdeling per status', 'report.distribuzionePerPriorita': 'Verdeling per prioriteit',
        'report.attivitaPerProgetto': 'Taken per project', 'report.noDataAvailable': 'Geen gegevens beschikbaar.',
        'report.noProjectAvailable': 'Geen project beschikbaar.', 'report.noEntriesRegistered': 'Geen rapportinvoer geregistreerd.',
        'report.taskSelectDefault': 'Selecteer een taak',
        'report.descPlaceholder': 'Beschrijf wat je vandaag hebt gedaan: voltooide taken, vergaderingen, tegengekomen problemen…',
        'report.timeWorked': 'Gewerkte tijd', 'report.hours': 'uur', 'report.minutes': 'minuten',
        'report.totalTasks': 'Totaal aantal taken', 'report.completionRate': 'Voltooiingspercentage',
        'report.estimatedTime': 'Geschatte tijd', 'report.actualTime': 'Werkelijke tijd', 'report.completate': 'Voltooid',
        'report.inCorso': 'Bezig', 'report.totale': 'Totaal', 'report.bloccate': 'Geblokkeerd', 'report.inPausa': 'Gepauzeerd',
        'report.savedSuccess': 'Rapportinvoer succesvol opgeslagen', 'report.saveError': 'Er is een fout opgetreden bij het opslaan van de rapportinvoer.'
    }
};

const I18N = (() => {
    'use strict';

    function getLang() {
        try {
            return localStorage.getItem(I18N_LANG_KEY) || I18N_DEFAULT_LANG;
        } catch {
            return I18N_DEFAULT_LANG;
        }
    }

    function setLang(lang) {
        try {
            localStorage.setItem(I18N_LANG_KEY, lang);
        } catch {
            /* storage non disponibile: il cambio lingua non persiste, non è bloccante */
        }
    }

    // 'en-GB' (non 'en-US') per mantenere l'ordine giorno-mese-anno già usato in
    // italiano in tutta l'interfaccia, evitando un cambio di layout tra lingue.
    const I18N_LOCALE_MAP = { it: 'it-IT', en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', sq: 'sq-AL', nl: 'nl-NL' };

    function locale() {
        return I18N_LOCALE_MAP[getLang()] || I18N_LOCALE_MAP[I18N_DEFAULT_LANG];
    }

    // Formatta una data ISO (YYYY-MM-DD) nella lingua corrente: usato ovunque nelle
    // pagine al posto di un formato fisso in italiano (es. "10 lug 2026").
    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso + 'T00:00:00');
        return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    }

    function formatDateLong(iso) {
        if (!iso) return '—';
        const d = new Date(iso + 'T00:00:00');
        return new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
    }

    function t(key, params) {
        const lang = getLang();
        let str = (I18N_STRINGS[lang] && I18N_STRINGS[lang][key])
            || (I18N_STRINGS[I18N_DEFAULT_LANG] && I18N_STRINGS[I18N_DEFAULT_LANG][key])
            || key;
        if (params) {
            Object.keys(params).forEach(p => {
                str = str.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
            });
        }
        return str;
    }

    // Applica le traduzioni a tutti gli elementi con data-i18n* dentro root
    // (documento intero di default, o un sotto-albero appena renderizzato via innerHTML).
    function applyTranslations(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });
        scope.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
        });
        scope.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });

        // Pulsanti/elementi ricorrenti riconoscibili dalla classe CSS, sempre con lo
        // stesso significato in ogni pagina: evita di dover marcare ogni occorrenza
        // con data-i18n una per una in ogni modale.
        scope.querySelectorAll('.btn-cancel').forEach(el => { el.textContent = t('common.cancel'); });
        scope.querySelectorAll('.btn-delete-confirm').forEach(el => { el.textContent = t('common.delete'); });
        scope.querySelectorAll('.modal__close').forEach(el => { el.setAttribute('aria-label', t('common.close')); });
        scope.querySelectorAll('.search-bar__input').forEach(el => { el.placeholder = t('common.search'); });
    }

    function flagSvg(code) {
        return I18N_FLAGS[code] || I18N_FLAGS.it;
    }

    // Aggiorna la bandiera + il nome mostrati nel pulsante "Cambia lingua" stesso.
    function updateSwitcherButton(btn) {
        const flagEl = btn.querySelector('.lang-switcher__flag');
        const nameEl = btn.querySelector('.lang-switcher__name');
        const lang = getLang();
        if (flagEl) flagEl.innerHTML = flagSvg(lang);
        if (nameEl) nameEl.textContent = t(`lang.name.${lang}`);
        btn.setAttribute('aria-label', t('lang.change'));
    }

    // Collega il pulsante "Cambia lingua" già presente nell'HTML (icona mondo +
    // bandiera + nome) a un menu a tendina generato via JS, senza dover
    // duplicare markup/CSS del dropdown in ogni pagina.
    function initLanguageSwitcher(selector) {
        const btn = document.querySelector(selector);
        if (!btn) return;

        // Adatta il markup esistente: la bandiera diventa un contenitore dedicato
        // (sostituendo l'SVG statico) e il testo lingua un nome dedicato.
        const flagContainer = btn.querySelector('span > svg') ? btn.querySelector('span > svg').parentElement : btn.querySelectorAll('span')[0];
        const nameContainer = btn.querySelectorAll('span')[btn.querySelectorAll('span').length - 1];
        if (flagContainer) flagContainer.classList.add('lang-switcher__flag');
        if (nameContainer) nameContainer.classList.add('lang-switcher__name');
        btn.classList.add('lang-switcher__btn');

        if (!document.getElementById('lang-switcher-styles')) {
            const style = document.createElement('style');
            style.id = 'lang-switcher-styles';
            style.textContent = `
                .lang-switcher__wrap { position: relative; }
                .lang-switcher__menu {
                    position: absolute;
                    bottom: calc(100% + 6px);
                    left: 0;
                    min-width: 180px;
                    background: var(--card-bg, #ffffff);
                    border-radius: 12px;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
                    padding: 6px;
                    z-index: 200;
                    max-height: 280px;
                    overflow-y: auto;
                }
                .lang-switcher__menu[hidden] { display: none; }
                .lang-switcher__menu--down { bottom: auto; top: calc(100% + 6px); }
                .lang-switcher__option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: 8px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 13.5px;
                    font-family: inherit;
                    color: var(--text-primary, #1e293b);
                    text-align: left;
                }
                .lang-switcher__option:hover { background: rgba(37, 99, 235, 0.1); }
                .lang-switcher__option.is-active { font-weight: 700; }
                .lang-switcher__option-flag { display: inline-flex; width: 18px; height: 13px; border-radius: 2px; overflow: hidden; flex-shrink: 0; }
                .lang-switcher__option-flag svg { width: 100%; height: 100%; display: block; }
            `;
            document.head.appendChild(style);
        }

        // Il pulsante nell'HTML statico non è avvolto in un contenitore posizionato:
        // ne creiamo uno al volo per ancorare il menu a tendina.
        const wrap = document.createElement('div');
        wrap.className = 'lang-switcher__wrap';
        btn.parentNode.insertBefore(wrap, btn);
        wrap.appendChild(btn);

        const menu = document.createElement('div');
        menu.className = 'lang-switcher__menu';
        menu.hidden = true;
        menu.setAttribute('role', 'menu');
        wrap.appendChild(menu);

        function renderMenu() {
            const current = getLang();
            menu.innerHTML = I18N_LANGUAGES.map(l => `
                <button type="button" class="lang-switcher__option${l.code === current ? ' is-active' : ''}" data-lang="${l.code}" role="menuitemradio" aria-checked="${l.code === current}">
                    <span class="lang-switcher__option-flag">${flagSvg(l.code)}</span>
                    <span>${t(l.nameKey)}</span>
                </button>`).join('');

            menu.querySelectorAll('[data-lang]').forEach(opt => {
                opt.addEventListener('click', () => {
                    setLang(opt.dataset.lang);
                    applyTranslations(document);
                    updateSwitcherButton(btn);
                    renderMenu();
                    closeMenu();
                    // Le pagine possono ascoltare questo evento per ri-renderizzare i
                    // contenuti generati via JS (badge di stato, titoli dinamici, grafici…)
                    // che data-i18n da solo non copre perché non esistono ancora nel DOM
                    // al momento di applyTranslations().
                    document.dispatchEvent(new CustomEvent('i18n:change'));
                });
            });
        }

        // Il menu apre di norma verso l'alto (adatto al pulsante in fondo alla
        // sidebar), ma nella pagina di login il pulsante è vicino alla cima di una
        // card centrata: se lo spazio sopra non basta e sotto ce n'è di più, apre
        // verso il basso invece di finire tagliato fuori dalla viewport.
        function openMenu() {
            renderMenu();
            menu.classList.remove('lang-switcher__menu--down');
            menu.hidden = false;
            const btnRect = btn.getBoundingClientRect();
            const menuHeight = menu.getBoundingClientRect().height;
            const spaceAbove = btnRect.top;
            const spaceBelow = window.innerHeight - btnRect.bottom;
            const shouldOpenDown = spaceAbove < menuHeight && spaceBelow > spaceAbove;
            menu.classList.toggle('lang-switcher__menu--down', shouldOpenDown);
            btn.setAttribute('aria-expanded', 'true');
        }
        function closeMenu() {
            menu.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
        }

        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu.hidden) openMenu(); else closeMenu();
        });
        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) closeMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.hidden) closeMenu();
        });

        updateSwitcherButton(btn);
    }

    return { t, getLang, setLang, applyTranslations, initLanguageSwitcher, formatDate, formatDateLong, LANGUAGES: I18N_LANGUAGES };
})();

document.addEventListener('DOMContentLoaded', () => {
    I18N.applyTranslations(document);
    // Ogni pagina ha un solo pulsante "Cambia lingua": login.html usa la classe
    // .login-lang, le pagine con sidebar usano .sidebar-footer__btn (escluso
    // quello di logout, che condivide la stessa classe base).
    I18N.initLanguageSwitcher('.login-lang, .sidebar-footer__btn:not(.sidebar-footer__btn--logout)');
});
