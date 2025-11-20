import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import ContentLibrary from "./ContentLibrary";

import ReviewQueue from "./ReviewQueue";

import KeywordsAndClusters from "./KeywordsAndClusters";

import ArticleEditor from "./ArticleEditor";

import Analytics from "./Analytics";

import Integrations from "./Integrations";

import Settings from "./Settings";

import SiteAnalysis from "./SiteAnalysis";

import ArticleGenerator from "./ArticleGenerator";

import TopicDiscovery from "./TopicDiscovery";

import QuickGenerate from "./QuickGenerate";

import ArticleReview from "./ArticleReview";

import AITraining from "./AITraining";

import ArticleWizard from "./ArticleWizard";

import ApprovedArticles from "./ApprovedArticles";

import ArticleWorkflow from "./ArticleWorkflow";

import SiteCatalog from "./SiteCatalog";

import Profile from "./Profile";

import GenerationProgress from "./GenerationProgress";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    ContentLibrary: ContentLibrary,
    
    ReviewQueue: ReviewQueue,
    
    KeywordsAndClusters: KeywordsAndClusters,
    
    ArticleEditor: ArticleEditor,
    
    Analytics: Analytics,
    
    Integrations: Integrations,
    
    Settings: Settings,
    
    SiteAnalysis: SiteAnalysis,
    
    ArticleGenerator: ArticleGenerator,
    
    TopicDiscovery: TopicDiscovery,
    
    QuickGenerate: QuickGenerate,
    
    ArticleReview: ArticleReview,
    
    AITraining: AITraining,
    
    ArticleWizard: ArticleWizard,
    
    ApprovedArticles: ApprovedArticles,
    
    ArticleWorkflow: ArticleWorkflow,
    
    SiteCatalog: SiteCatalog,
    
    Profile: Profile,
    
    GenerationProgress: GenerationProgress,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/ContentLibrary" element={<ContentLibrary />} />
                
                <Route path="/ReviewQueue" element={<ReviewQueue />} />
                
                <Route path="/KeywordsAndClusters" element={<KeywordsAndClusters />} />
                
                <Route path="/ArticleEditor" element={<ArticleEditor />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Integrations" element={<Integrations />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/SiteAnalysis" element={<SiteAnalysis />} />
                
                <Route path="/ArticleGenerator" element={<ArticleGenerator />} />
                
                <Route path="/TopicDiscovery" element={<TopicDiscovery />} />
                
                <Route path="/QuickGenerate" element={<QuickGenerate />} />
                
                <Route path="/ArticleReview" element={<ArticleReview />} />
                
                <Route path="/AITraining" element={<AITraining />} />
                
                <Route path="/ArticleWizard" element={<ArticleWizard />} />
                
                <Route path="/ApprovedArticles" element={<ApprovedArticles />} />
                
                <Route path="/ArticleWorkflow" element={<ArticleWorkflow />} />
                
                <Route path="/SiteCatalog" element={<SiteCatalog />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/GenerationProgress" element={<GenerationProgress />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}