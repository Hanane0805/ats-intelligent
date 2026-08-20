'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  lang: Language;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: (key) => key,
  toggleLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('ats_language') as Language;
    if (saved === 'en' || saved === 'fr') {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'fr' : 'en';
    setLang(next);
    localStorage.setItem('ats_language', next);
  };

  const t = (key: string): string => {
    const dict = lang === 'fr' ? fr : en;
    return (dict as Record<string, string>)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── English (default) ────────────────────────────────────────────────────────
const en: Record<string, string> = {
  // Sidebar - Recruiting
  'nav.dashboard': 'Dashboard',
  'nav.sourcing': 'Sourcing AI',
  'nav.jobs': 'Job Positions',
  'nav.candidates': 'Candidates',
  'nav.analysis': 'CV Analysis',
  'nav.rankings': 'Rankings',
  'nav.pipeline': 'Pipeline (Track)',
  'nav.history': 'History',
  'nav.stats': 'Statistics',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  // Sidebar - Admin
  'nav.admin': 'Admin Dashboard',
  'nav.users': 'User Management',
  'nav.roles': 'Role Management',
  'nav.logs': 'Audit Logs',
  // Sidebar - Candidate
  'nav.findJobs': 'Find a Job',
  'nav.myApplications': 'My Applications',
  'nav.myProfile': 'My Profile',
  // Sidebar sections
  'nav.section.recruiting': 'Recruiting',
  'nav.section.administration': 'Administration',
  'nav.section.mySpace': 'My Space',
  // Sidebar footer
  'sidebar.darkMode': 'Dark Mode',
  'sidebar.logout': 'Logout',
  // Header
  'header.search': 'Search candidates, jobs...',
  'header.notifications': 'Notifications',
  // Dashboard page
  'dashboard.title': 'AI Dashboard',
  'dashboard.subtitle': 'Real-time recruitment insights',
  'dashboard.totalCandidates': 'Total Candidates',
  'dashboard.totalApplications': 'Total Applications',
  'dashboard.activePositions': 'Active Positions',
  'dashboard.avgScore': 'Avg. AI Score',
  'dashboard.pending': 'Pending',
  'dashboard.accepted': 'Accepted',
  'dashboard.rejected': 'Rejected',
  'dashboard.recentApplications': 'Recent Applications',
  'dashboard.viewAll': 'View All',
  'dashboard.noData': 'No data available',
  // Jobs page
  'jobs.title': 'Job Positions',
  'jobs.titleCandidate': 'Job Offers',
  'jobs.positions': 'positions',
  'jobs.offers': 'offers',
  'jobs.createBtn': 'Create Position',
  'jobs.searchPlaceholder': 'Search positions...',
  'jobs.all': 'All',
  'jobs.active': 'Active',
  'jobs.closed': 'Closed',
  'jobs.colTitle': 'Position Title',
  'jobs.colRecruiter': 'Recruiter',
  'jobs.colDescription': 'Description',
  'jobs.colStatus': 'Status',
  'jobs.colPosted': 'Posted',
  'jobs.colActions': 'Actions',
  'jobs.apply': 'Apply',
  'jobs.empty': 'No positions found.',
  'jobs.emptyHint': 'Create your first position by clicking "Create Position".',
  'jobs.loading': 'Loading positions...',
  'jobs.modal.title': 'Create New Position',
  'jobs.modal.subtitle': 'Fill in the details for the new job opening',
  'jobs.modal.jobTitle': 'Job Title',
  'jobs.modal.description': 'Description',
  'jobs.modal.descPlaceholder': 'Describe the role, responsibilities, requirements...',
  'jobs.modal.cancel': 'Cancel',
  'jobs.modal.creating': 'Creating...',
  'jobs.modal.submit': 'Create Position',
  'jobs.applied': 'Application sent successfully!',
  // Candidates page
  'candidates.title': 'Candidates',
  'candidates.searchPlaceholder': 'Search candidates...',
  'candidates.addBtn': 'Add Candidate',
  'candidates.colName': 'Name',
  'candidates.colEmail': 'Email',
  'candidates.colStatus': 'Status',
  'candidates.colActions': 'Actions',
  'candidates.empty': 'No candidates found.',
  'candidates.loading': 'Loading candidates...',
  'candidates.active': 'Active',
  'candidates.inactive': 'Inactive',
  // Analysis page
  'analysis.title': 'CV Analysis',
  'analysis.subtitle': 'AI-powered resume evaluation',
  'analysis.searchPlaceholder': 'Search by candidate or position...',
  'analysis.colCandidate': 'Candidate',
  'analysis.colPosition': 'Position',
  'analysis.colScore': 'AI Score',
  'analysis.colStatus': 'Status',
  'analysis.colDate': 'Date',
  'analysis.colActions': 'Actions',
  'analysis.analyze': 'Analyze',
  'analysis.loading': 'Loading analyses...',
  'analysis.empty': 'No analyses yet.',
  // Rankings page
  'rankings.title': 'Rankings',
  'rankings.subtitle': 'Candidates ranked by AI compatibility score',
  'rankings.selectPosition': 'Select a position...',
  'rankings.colRank': 'Rank',
  'rankings.colCandidate': 'Candidate',
  'rankings.colScore': 'Score',
  'rankings.colStatus': 'Status',
  'rankings.empty': 'Select a position to view rankings.',
  'rankings.loading': 'Loading rankings...',
  // Pipeline page
  'pipeline.title': 'Pipeline (Track)',
  'pipeline.subtitle': 'Manage applications with drag & drop',
  'pipeline.searchPlaceholder': 'Search by candidate or position...',
  'pipeline.toProcess': 'To Process',
  'pipeline.inAnalysis': 'In Analysis',
  'pipeline.interview': 'Interview',
  'pipeline.accepted': 'Accepted',
  'pipeline.rejected': 'Rejected',
  'pipeline.loading': 'Loading applications...',
  'pipeline.empty': 'No applications.',
  // History page
  'history.title': 'Recruitment History',
  'history.subtitle': 'Timeline of all candidate status changes and activities',
  'history.refresh': 'Refresh Timeline',
  'history.searchPlaceholder': 'Search by candidate or position...',
  'history.filterAll': 'All',
  'history.noEvents': 'No events found.',
  'history.filterHint': 'Try adjusting your filters.',
  'history.loading': 'Loading history...',
  // Statistics page
  'stats.title': 'Statistics',
  'stats.subtitle': 'Recruitment performance analytics',
  'stats.totalApplications': 'Total Applications',
  'stats.acceptanceRate': 'Acceptance Rate',
  'stats.avgScore': 'Avg. AI Score',
  'stats.activePositions': 'Active Positions',
  'stats.loading': 'Loading statistics...',
  // Profile page
  'profile.title': 'Profile',
  'profile.save': 'Save Changes',
  'profile.firstName': 'First Name',
  'profile.lastName': 'Last Name',
  'profile.email': 'Email',
  'profile.department': 'Department',
  // Settings page
  'settings.title': 'Settings',
  'settings.save': 'Save',
  // My Applications page
  'myApps.title': 'My Applications',
  'myApps.subtitle': 'Track your application status in real time.',
  'myApps.colPosition': 'Position',
  'myApps.colDate': 'Date',
  'myApps.colStatus': 'Status',
  'myApps.empty': 'You have not submitted any applications.',
  'myApps.emptyHint': 'Browse job offers to apply.',
  'myApps.loading': 'Loading your applications...',
  // Statuses
  'status.pending': 'Pending',
  'status.inAnalysis': 'In Analysis',
  'status.interview': 'Interview',
  'status.accepted': 'Accepted',
  'status.rejected': 'Rejected',
  'status.active': 'Active',
  'status.closed': 'Closed',
  // Sourcing page
  'sourcing.title': 'AI Sourcing',
  'sourcing.subtitle': 'Generate targeted candidate search strategies',
  // Admin
  'admin.title': 'Admin Dashboard',
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.view': 'View',
  'common.search': 'Search',
  'common.total': 'total',
  // Signup page
  'signup.asCandidate': 'I am a Candidate',
  'signup.asRecruiter': 'I am a Recruiter',
};

// ─── French ───────────────────────────────────────────────────────────────────
const fr: Record<string, string> = {
  // Sidebar - Recruiting
  'nav.dashboard': 'Tableau de Bord',
  'nav.sourcing': 'Sourcing IA',
  'nav.jobs': 'Offres d\'emploi',
  'nav.candidates': 'Candidats',
  'nav.analysis': 'Analyse CV',
  'nav.rankings': 'Classements',
  'nav.pipeline': 'Pipeline (Suivi)',
  'nav.history': 'Historique',
  'nav.stats': 'Statistiques',
  'nav.profile': 'Profil',
  'nav.settings': 'Paramètres',
  // Sidebar - Admin
  'nav.admin': 'Admin',
  'nav.users': 'Gestion des Utilisateurs',
  'nav.roles': 'Gestion des Rôles',
  'nav.logs': 'Journaux d\'Audit',
  // Sidebar - Candidate
  'nav.findJobs': 'Trouver un emploi',
  'nav.myApplications': 'Mes Candidatures',
  'nav.myProfile': 'Mon Profil',
  // Sidebar sections
  'nav.section.recruiting': 'Recrutement',
  'nav.section.administration': 'Administration',
  'nav.section.mySpace': 'Mon Espace',
  // Sidebar footer
  'sidebar.darkMode': 'Mode sombre',
  'sidebar.logout': 'Déconnexion',
  // Header
  'header.search': 'Rechercher candidats, postes...',
  'header.notifications': 'Notifications',
  // Dashboard page
  'dashboard.title': 'Tableau de Bord IA',
  'dashboard.subtitle': 'Aperçu du recrutement en temps réel',
  'dashboard.totalCandidates': 'Total Candidats',
  'dashboard.totalApplications': 'Total Candidatures',
  'dashboard.activePositions': 'Postes Actifs',
  'dashboard.avgScore': 'Score IA Moyen',
  'dashboard.pending': 'En attente',
  'dashboard.accepted': 'Acceptés',
  'dashboard.rejected': 'Rejetés',
  'dashboard.recentApplications': 'Candidatures Récentes',
  'dashboard.viewAll': 'Voir tout',
  'dashboard.noData': 'Aucune donnée disponible',
  // Jobs page
  'jobs.title': 'Offres d\'emploi',
  'jobs.titleCandidate': 'Offres d\'emploi',
  'jobs.positions': 'postes',
  'jobs.offers': 'offres',
  'jobs.createBtn': 'Créer un poste',
  'jobs.searchPlaceholder': 'Rechercher des postes...',
  'jobs.all': 'Tous',
  'jobs.active': 'Actif',
  'jobs.closed': 'Fermé',
  'jobs.colTitle': 'Intitulé du poste',
  'jobs.colRecruiter': 'Recruteur',
  'jobs.colDescription': 'Description',
  'jobs.colStatus': 'Statut',
  'jobs.colPosted': 'Publié le',
  'jobs.colActions': 'Actions',
  'jobs.apply': 'Postuler',
  'jobs.empty': 'Aucun poste trouvé.',
  'jobs.emptyHint': 'Créez votre premier poste en cliquant sur "Créer un poste".',
  'jobs.loading': 'Chargement des postes...',
  'jobs.modal.title': 'Créer un nouveau poste',
  'jobs.modal.subtitle': 'Renseignez les informations du nouveau poste',
  'jobs.modal.jobTitle': 'Intitulé du poste',
  'jobs.modal.description': 'Description',
  'jobs.modal.descPlaceholder': 'Décrivez le rôle, les responsabilités, les exigences...',
  'jobs.modal.cancel': 'Annuler',
  'jobs.modal.creating': 'Création...',
  'jobs.modal.submit': 'Créer le poste',
  'jobs.applied': 'Candidature envoyée avec succès !',
  // Candidates page
  'candidates.title': 'Candidats',
  'candidates.searchPlaceholder': 'Rechercher des candidats...',
  'candidates.addBtn': 'Ajouter un candidat',
  'candidates.colName': 'Nom',
  'candidates.colEmail': 'E-mail',
  'candidates.colStatus': 'Statut',
  'candidates.colActions': 'Actions',
  'candidates.empty': 'Aucun candidat trouvé.',
  'candidates.loading': 'Chargement des candidats...',
  'candidates.active': 'Actif',
  'candidates.inactive': 'Inactif',
  // Analysis page
  'analysis.title': 'Analyse de CV',
  'analysis.subtitle': 'Évaluation des CV par intelligence artificielle',
  'analysis.searchPlaceholder': 'Rechercher par candidat ou poste...',
  'analysis.colCandidate': 'Candidat',
  'analysis.colPosition': 'Poste',
  'analysis.colScore': 'Score IA',
  'analysis.colStatus': 'Statut',
  'analysis.colDate': 'Date',
  'analysis.colActions': 'Actions',
  'analysis.analyze': 'Analyser',
  'analysis.loading': 'Chargement des analyses...',
  'analysis.empty': 'Aucune analyse pour le moment.',
  // Rankings page
  'rankings.title': 'Classements',
  'rankings.subtitle': 'Candidats classés par score de compatibilité IA',
  'rankings.selectPosition': 'Sélectionner un poste...',
  'rankings.colRank': 'Rang',
  'rankings.colCandidate': 'Candidat',
  'rankings.colScore': 'Score',
  'rankings.colStatus': 'Statut',
  'rankings.empty': 'Sélectionnez un poste pour voir les classements.',
  'rankings.loading': 'Chargement des classements...',
  // Pipeline page
  'pipeline.title': 'Pipeline (Suivi)',
  'pipeline.subtitle': 'Gérez les candidatures par glisser-déposer',
  'pipeline.searchPlaceholder': 'Rechercher par candidat ou poste...',
  'pipeline.toProcess': 'À traiter',
  'pipeline.inAnalysis': 'En analyse',
  'pipeline.interview': 'Entretien',
  'pipeline.accepted': 'Accepté',
  'pipeline.rejected': 'Rejeté',
  'pipeline.loading': 'Chargement des candidatures...',
  'pipeline.empty': 'Aucune candidature.',
  // History page
  'history.title': 'Historique de Recrutement',
  'history.subtitle': 'Chronologie de toutes les modifications de statut',
  'history.refresh': 'Actualiser',
  'history.searchPlaceholder': 'Rechercher par candidat ou poste...',
  'history.filterAll': 'Tous',
  'history.noEvents': 'Aucun événement trouvé.',
  'history.filterHint': 'Essayez de modifier vos filtres.',
  'history.loading': 'Chargement de l\'historique...',
  // Statistics page
  'stats.title': 'Statistiques',
  'stats.subtitle': 'Analyse des performances de recrutement',
  'stats.totalApplications': 'Total Candidatures',
  'stats.acceptanceRate': 'Taux d\'acceptation',
  'stats.avgScore': 'Score IA Moyen',
  'stats.activePositions': 'Postes Actifs',
  'stats.loading': 'Chargement des statistiques...',
  // Profile page
  'profile.title': 'Profil',
  'profile.save': 'Enregistrer',
  'profile.firstName': 'Prénom',
  'profile.lastName': 'Nom',
  'profile.email': 'E-mail',
  'profile.department': 'Département',
  // Settings page
  'settings.title': 'Paramètres',
  'settings.save': 'Enregistrer',
  // My Applications page
  'myApps.title': 'Mes Candidatures',
  'myApps.subtitle': 'Suivez l\'état de vos postulations en temps réel.',
  'myApps.colPosition': 'Poste',
  'myApps.colDate': 'Date',
  'myApps.colStatus': 'Statut',
  'myApps.empty': 'Vous n\'avez envoyé aucune candidature.',
  'myApps.emptyHint': 'Consultez les offres d\'emploi pour postuler.',
  'myApps.loading': 'Chargement de vos candidatures...',
  // Statuses
  'status.pending': 'En attente',
  'status.inAnalysis': 'En analyse',
  'status.interview': 'Entretien',
  'status.accepted': 'Accepté',
  'status.rejected': 'Rejeté',
  'status.active': 'Actif',
  'status.closed': 'Fermé',
  // Sourcing page
  'sourcing.title': 'Sourcing IA',
  'sourcing.subtitle': 'Générez des stratégies de recherche de candidats ciblées',
  // Admin
  'admin.title': 'Administration',
  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.view': 'Voir',
  'common.search': 'Rechercher',
  'common.total': 'total',
  // Signup page
  'signup.asCandidate': 'Je suis Candidat',
  'signup.asRecruiter': 'Je suis Recruteur',
};
