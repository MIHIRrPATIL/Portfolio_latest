"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Mail,
  Trophy,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileText,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Download,
  Upload,
  FileUp,
  FileCheck,
  AlertCircle
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Lead {
  id: number;
  visitor_name: string;
  email: string;
  message: string;
  project_scope: string;
  status: "pending" | "reviewed" | "contacted" | "archived";
  notes?: string;
  created_at: string;
}

interface Achievement {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  proof_url?: string;
  icon?: string;
  tags: string[];
  is_featured: boolean;
  created_at?: string;
}

interface Blog {
  id: string;
  title: string;
  summary: string;
  content?: string;
  cover_image?: string;
  external_url?: string;
  tags: string[];
  read_time?: string;
  is_published: boolean;
  views?: number;
  published_at?: string;
}

interface ResumeInfo {
  filename: string;
  has_file: boolean;
  external_url?: string | null;
  size_bytes: number;
  download_count: number;
  is_active: boolean;
  updated_at?: string | null;
}

import { API_V1 } from "@/lib/api-config";

const API_BASE = API_V1;

export default function AdminPortalPage() {
  const [passkey, setPasskey] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"inbox" | "achievements" | "blogs" | "resume">("inbox");
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [leadFilter, setLeadFilter] = useState<string>("all");

  // Resume Manager State
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeExternalUrl, setResumeExternalUrl] = useState("");
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState("");
  const [resumeErrorMsg, setResumeErrorMsg] = useState("");

  // Email Notification Test State
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState("");

  // Achievement Modal / Form State
  const [isAchModalOpen, setIsAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<Partial<Achievement> | null>(null);

  // Blog Editor State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [blogPreviewMode, setBlogPreviewMode] = useState(false);

  const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);

  // Load session token on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("mihir_admin_token");
    if (saved) {
      setToken(saved);
      loadAllAdminData(saved);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_BASE}/admin/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        sessionStorage.setItem("mihir_admin_token", data.token);
        loadAllAdminData(data.token);
      } else {
        setAuthError("Access Denied: Invalid Administrative Passkey.");
      }
    } catch (err) {
      setAuthError("Server unreachable. Please ensure the FastAPI backend is running.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("mihir_admin_token");
    setToken(null);
    setPasskey("");
  };

  const loadAllAdminData = async (activeToken: string) => {
    setIsLoading(true);
    const headers = { "X-Admin-Key": activeToken };
    try {
      const [rLeads, rAch, rBlogs, rResume] = await Promise.all([
        fetch(`${API_BASE}/admin/leads`, { headers }),
        fetch(`${API_BASE}/admin/achievements`, { headers }),
        fetch(`${API_BASE}/admin/blogs`, { headers }),
        fetch(`${API_BASE}/admin/resume`, { headers }),
      ]);

      if (rLeads.ok) setLeads(await rLeads.json());
      if (rAch.ok) setAchievements(await rAch.json());
      if (rBlogs.ok) setBlogs(await rBlogs.json());
      if (rResume.ok) {
        const resData: ResumeInfo = await rResume.json();
        setResumeInfo(resData);
        if (resData.external_url) setResumeExternalUrl(resData.external_url);
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Resume Handlers
  const handleUploadResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResumeErrorMsg("Only PDF (.pdf) files are supported.");
      return;
    }

    setUploadingResume(true);
    setResumeErrorMsg("");
    setResumeSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);
    if (resumeExternalUrl) {
      formData.append("external_url", resumeExternalUrl);
    }

    try {
      const res = await fetch(`${API_BASE}/admin/resume/upload`, {
        method: "POST",
        headers: { "X-Admin-Key": token },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResumeSuccessMsg(`Successfully uploaded ${data.filename}!`);
        loadAllAdminData(token);
      } else {
        const err = await res.json();
        setResumeErrorMsg(err.detail || "Failed to upload resume.");
      }
    } catch (err) {
      setResumeErrorMsg("Network error while uploading resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveResumeExternalUrl = async () => {
    if (!token) return;
    setUploadingResume(true);
    setResumeErrorMsg("");
    setResumeSuccessMsg("");

    const formData = new FormData();
    formData.append("external_url", resumeExternalUrl.trim());

    try {
      const res = await fetch(`${API_BASE}/admin/resume/upload`, {
        method: "POST",
        headers: { "X-Admin-Key": token },
        body: formData,
      });

      if (res.ok) {
        setResumeSuccessMsg("Resume link saved successfully!");
        loadAllAdminData(token);
      } else {
        const err = await res.json();
        setResumeErrorMsg(err.detail || "Failed to save external link.");
      }
    } catch (err) {
      setResumeErrorMsg("Network error while saving link.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!token || !confirm("Are you sure you want to delete the active resume document?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/resume`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setResumeSuccessMsg("Resume document reset successfully.");
        setResumeExternalUrl("");
        loadAllAdminData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Test Email Notification Action
  const handleTestEmailNotification = async () => {
    if (!token) return;
    setTestingEmail(true);
    setTestEmailMsg("");
    try {
      const res = await fetch(`${API_BASE}/admin/email/test`, {
        method: "POST",
        headers: { "X-Admin-Key": token },
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailMsg(`✅ ${data.message || "Test email dispatched!"}`);
      } else {
        setTestEmailMsg(`⚠️ ${data.detail || "Failed to trigger test email."}`);
      }
    } catch (err) {
      setTestEmailMsg("⚠️ Network error while sending test email.");
    } finally {
      setTestingEmail(false);
      setTimeout(() => setTestEmailMsg(""), 7000);
    }
  };

  // Lead Actions
  const handleUpdateLeadStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus as any } : l))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!token || !confirm("Are you sure you want to permanently delete this lead?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyEmailToClipboard = (id: number, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Achievement Save
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingAch?.title || !editingAch?.description) return;

    try {
      const isEdit = !!editingAch.id && achievements.some((a) => a.id === editingAch.id);
      const url = isEdit
        ? `${API_BASE}/admin/achievements/${editingAch.id}`
        : `${API_BASE}/admin/achievements`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify({
          ...editingAch,
          tags: Array.isArray(editingAch.tags)
            ? editingAch.tags
            : (editingAch.tags as any || "").split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsAchModalOpen(false);
        setEditingAch(null);
        loadAllAdminData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!token || !confirm(`Delete achievement '${id}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/achievements/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Blog Save
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingBlog?.title || !editingBlog?.summary) return;

    try {
      const isEdit = !!editingBlog.id && blogs.some((b) => b.id === editingBlog.id);
      const url = isEdit
        ? `${API_BASE}/admin/blogs/${editingBlog.id}`
        : `${API_BASE}/admin/blogs`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify({
          ...editingBlog,
          tags: Array.isArray(editingBlog.tags)
            ? editingBlog.tags
            : (editingBlog.tags as any || "").split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsBlogModalOpen(false);
        setEditingBlog(null);
        loadAllAdminData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!token || !confirm(`Delete blog post '${id}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/blogs/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Unauthenticated Gate Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl bg-[#09090b] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 text-red-300">
            <Lock className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-black">// MIHIR.ADMIN_AUTH</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
            Restricted Root Terminal
          </h1>
          <p className="text-xs text-white/50 mb-8 leading-relaxed">
            Administrative access only. Enter the master passkey to manage visitor inquiries, achievements, and engineering articles.
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2 font-bold">
                Passkey Authorization
              </label>
              <input
                type="password"
                placeholder="Enter master passkey..."
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-red-300 transition-colors"
                autoFocus
              />
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-sans font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-red-300 transition-colors disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Filtered Leads
  const filteredLeads = leads.filter((l) =>
    leadFilter === "all" ? true : l.status === leadFilter
  );
  const pendingCount = leads.filter((l) => l.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans selection:bg-red-300 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300 animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold text-red-300 uppercase tracking-widest">
              // MIHIR.ADMIN_ROOT v2.6
            </div>
            <div className="text-[10px] font-mono text-white/40 uppercase">
              Database: PostgreSQL Render (portfolio_p7sm)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => loadAllAdminData(token)}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
          >
            Lock Session
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Visitor Leads</span>
              <Mail className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{leads.length}</div>
            <div className="text-xs text-red-300 mt-1 font-mono">{pendingCount} pending review</div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Achievements</span>
              <Trophy className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{achievements.length}</div>
            <div className="text-xs text-white/40 mt-1 font-mono">
              {achievements.filter((a) => a.is_featured).length} featured on portfolio
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Blogs & Thoughts</span>
              <BookOpen className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{blogs.length}</div>
            <div className="text-xs text-white/40 mt-1 font-mono">
              {blogs.filter((b) => b.is_published).length} published live
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Resume / CV</span>
              <FileText className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{resumeInfo?.download_count ?? 0}</div>
            <div className="text-xs text-white/40 mt-1 font-mono flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${resumeInfo?.has_file || resumeInfo?.external_url ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>{resumeInfo?.has_file ? "PDF Active" : resumeInfo?.external_url ? "Cloud URL Active" : "No Resume"}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4 mb-8">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "inbox"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Inquiries Inbox</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "achievements"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Achievements ({achievements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "blogs"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Blogs & Thoughts ({blogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("resume")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "resume"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume / CV Manager</span>
          </button>
        </div>

        {/* TAB 1: INQUIRIES INBOX */}
        {activeTab === "inbox" && (
          <div>
            {testEmailMsg && (
              <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/15 text-xs font-mono text-white flex items-center justify-between">
                <span>{testEmailMsg}</span>
                <button
                  onClick={() => setTestEmailMsg("")}
                  className="text-white/40 hover:text-white text-xs cursor-pointer ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                {["all", "pending", "contacted", "reviewed", "archived"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeadFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      leadFilter === st
                        ? "bg-red-300 text-black font-bold"
                        : "bg-white/5 text-white/50 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestEmailNotification}
                  disabled={testingEmail}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-300/40 text-xs font-mono text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-2"
                  title="Test email alert dispatch to your configured notification email"
                >
                  <Mail className={`w-3.5 h-3.5 text-red-300 ${testingEmail ? "animate-pulse" : ""}`} />
                  <span>{testingEmail ? "Sending Test Email..." : "Send Test Email Alert"}</span>
                </button>
                <span className="text-xs font-mono text-white/40">Showing {filteredLeads.length} leads</span>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="p-16 text-center rounded-2xl bg-[#0a0a0e] border border-white/10 text-white/40 font-mono text-sm">
                No inquiries matching filter '{leadFilter}'.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-[#0c0c11] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-white text-base">{lead.visitor_name}</span>
                        <button
                          onClick={() => copyEmailToClipboard(lead.id, lead.email)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs font-mono text-red-300 transition-colors cursor-pointer"
                        >
                          {copiedEmailId === lead.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{lead.email}</span>
                            </>
                          )}
                        </button>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                            lead.status === "pending"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : lead.status === "contacted"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {lead.status}
                        </span>
                        <span className="text-[10px] font-mono text-white/30">
                          {lead.created_at ? new Date(lead.created_at).toLocaleString() : ""}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-white/50">
                        Scope: <span className="text-white/80">{lead.project_scope}</span>
                      </div>

                      <p className="text-sm text-white/80 whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-white/5 font-sans leading-relaxed">
                        {lead.message}
                      </p>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 flex-shrink-0">
                      {lead.status !== "contacted" && (
                        <button
                          onClick={() => handleUpdateLeadStatus(lead.id, "contacted")}
                          className="px-3 py-1.5 rounded-lg bg-green-950/40 hover:bg-green-900/60 border border-green-500/30 text-green-300 text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
                        >
                          Mark Contacted
                        </button>
                      )}
                      {lead.status !== "reviewed" && (
                        <button
                          onClick={() => handleUpdateLeadStatus(lead.id, "reviewed")}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS MANAGER */}
        {activeTab === "achievements" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Career Milestones & Achievements</h2>
              <button
                onClick={() => {
                  setEditingAch({
                    title: "",
                    category: "Research",
                    date: "2026",
                    description: "",
                    proof_url: "",
                    icon: "trophy",
                    tags: [],
                    is_featured: true,
                  });
                  setIsAchModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-300 text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Achievement</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-6 rounded-2xl bg-[#0c0c11] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-300/10 text-red-300 text-[10px] font-mono uppercase font-bold border border-red-300/20">
                        {ach.category}
                      </span>
                      <span className="text-xs font-mono text-white/40">{ach.date}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{ach.title}</h3>
                    <p className="text-xs text-white/60 leading-relaxed">{ach.description}</p>

                    {ach.tags && ach.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {ach.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[10px] font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
                    {ach.proof_url ? (
                      <a
                        href={ach.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-red-300 hover:underline flex items-center gap-1"
                      >
                        <span>View Proof / Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingAch(ach);
                          setIsAchModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BLOGS & THOUGHTS */}
        {activeTab === "blogs" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Engineering Thoughts & Articles</h2>
              <button
                onClick={() => {
                  setEditingBlog({
                    title: "",
                    summary: "",
                    content: "",
                    cover_image: "",
                    external_url: "",
                    tags: [],
                    read_time: "3 min read",
                    is_published: true,
                  });
                  setBlogPreviewMode(false);
                  setIsBlogModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-300 text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write Blog / Thought</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl bg-[#0c0c11] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {b.cover_image && (
                    <div className="h-40 w-full overflow-hidden bg-black/50 relative">
                      <img
                        src={b.cover_image}
                        alt={b.title}
                        className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          b.is_published ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">{b.read_time || "3 min read"}</span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-2">{b.title}</h3>
                    <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">{b.summary}</p>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4 pt-4">
                    <span className="text-[10px] font-mono text-white/40">{b.views || 0} views</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBlog(b);
                          setBlogPreviewMode(false);
                          setIsBlogModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(b.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RESUME / CV MANAGER */}
        {activeTab === "resume" && (
          <div className="space-y-8">
            {/* Status & Overview Hero Card */}
            <div className="p-8 rounded-3xl bg-[#0a0a0f] border border-white/15 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-red-300 font-bold uppercase tracking-widest">
                      // RESUME_TELEMETRY & ASSET_CONTROLLER
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                        resumeInfo?.has_file
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          : resumeInfo?.external_url
                          ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {resumeInfo?.has_file
                        ? "Local PDF Active"
                        : resumeInfo?.external_url
                        ? "External Cloud URL Active"
                        : "No Document Uploaded"}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                    Curriculum Vitae Asset Manager
                  </h2>
                  <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-2xl font-sans">
                    Upload and replace your master Resume PDF or configure an external cloud document. Updates propagate immediately across all public buttons, mobile menus, and the AI Copilot.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`${API_BASE}/public/resume`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                      resumeInfo?.has_file || resumeInfo?.external_url
                        ? "bg-white text-black hover:bg-red-300 shadow-lg"
                        : "bg-white/10 text-white/40 pointer-events-none"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Preview</span>
                  </a>

                  {(resumeInfo?.has_file || resumeInfo?.external_url) && (
                    <button
                      onClick={handleDeleteResume}
                      className="px-4 py-3 rounded-xl bg-red-950/20 hover:bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Reset / Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Asset Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 font-mono">
                <div>
                  <div className="text-[10px] uppercase text-white/40 tracking-wider">Active Filename</div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {resumeInfo?.filename || "Mihir_Patil_Resume.pdf"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40 tracking-wider">File Size</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {resumeInfo?.size_bytes
                      ? `${(resumeInfo.size_bytes / (1024 * 1024)).toFixed(2)} MB (${(
                          resumeInfo.size_bytes / 1024
                        ).toFixed(0)} KB)`
                      : "N/A (Cloud Link)"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40 tracking-wider">Total Downloads</div>
                  <div className="text-sm font-bold text-red-300 mt-0.5 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>{resumeInfo?.download_count ?? 0} downloads</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40 tracking-wider">Last Modified</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {resumeInfo?.updated_at
                      ? new Date(resumeInfo.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never updated"}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Messages */}
            {resumeSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{resumeSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setResumeSuccessMsg("")}
                  className="text-emerald-400/60 hover:text-emerald-300 text-xs"
                >
                  [DISMISS]
                </button>
              </motion.div>
            )}

            {resumeErrorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 font-mono text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{resumeErrorMsg}</span>
                </div>
                <button
                  onClick={() => setResumeErrorMsg("")}
                  className="text-red-400/60 hover:text-red-300 text-xs"
                >
                  [DISMISS]
                </button>
              </motion.div>
            )}

            {/* Two-Column Upload & Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Option 1: Direct PDF Upload */}
              <div className="p-8 rounded-3xl bg-[#09090e] border border-white/10 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-red-300 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                    <FileUp className="w-4 h-4" />
                    <span>Method A: Master PDF Document Upload</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Direct PDF Upload & Storage</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Upload your compiled LaTeX PDF. It will be stored securely on the server and delivered directly as an instant attachment download.
                  </p>
                </div>

                <div className="border-2 border-dashed border-white/15 hover:border-red-300/50 rounded-2xl p-8 text-center transition-colors bg-white/[0.01] hover:bg-white/[0.03] relative group">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleUploadResumeFile}
                    disabled={uploadingResume}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 group-hover:border-red-300 transition-all text-red-300">
                      {uploadingResume ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-mono">
                        {uploadingResume ? "Uploading & Validating PDF..." : "Drop new Resume PDF here"}
                      </div>
                      <div className="text-xs text-white/40 mt-1">or click to browse your computer (.pdf max 15MB)</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-white/40 flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enforces standard RFC PDF headers with automatic attachment stream naming.</span>
                </div>
              </div>

              {/* Option 2: External Cloud Document URL */}
              <div className="p-8 rounded-3xl bg-[#09090e] border border-white/10 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-red-300 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                    <ExternalLink className="w-4 h-4" />
                    <span>Method B: Cloud Link / Drive Fallback</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">External Resume URL</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Optionally provide an external link (Google Drive, Notion, Dropbox, or Overleaf). If no local PDF is uploaded, visitors will be redirected to this URL.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 block font-bold">
                    Cloud Document URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/... or https://notion.so/..."
                    value={resumeExternalUrl}
                    onChange={(e) => setResumeExternalUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-white/15 text-white placeholder:text-white/30 text-xs font-mono focus:outline-none focus:border-red-300 transition-colors"
                  />
                  <button
                    onClick={handleSaveResumeExternalUrl}
                    disabled={uploadingResume || !resumeExternalUrl.trim()}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {uploadingResume ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Link...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Cloud Resume Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-white/40 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-red-300" />
                  <span>Telemetry accurately tracks redirection clicks as verified downloads.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ACHIEVEMENT MODAL */}
      <AnimatePresence>
        {isAchModalOpen && editingAch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[#0c0c11] border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">
                  {editingAch.id ? "Edit Achievement" : "Add Achievement / Milestone"}
                </h3>
                <button
                  onClick={() => setIsAchModalOpen(false)}
                  className="text-white/40 hover:text-white text-xs font-mono"
                >
                  [ESC / CLOSE]
                </button>
              </div>

              <form onSubmit={handleSaveAchievement} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-white/60 block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Speech AI Research Fellow at CDAC"
                    value={editingAch.title || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1">Category</label>
                    <select
                      value={editingAch.category || "Research"}
                      onChange={(e) => setEditingAch({ ...editingAch, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                    >
                      <option value="Research">Research</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Open Source">Open Source</option>
                      <option value="Milestone">Milestone</option>
                      <option value="Certification">Certification</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1">Date / Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026 or Aug 2025"
                      value={editingAch.date || ""}
                      onChange={(e) => setEditingAch({ ...editingAch, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Key impact, technical innovations, algorithms used..."
                    value={editingAch.description || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, description: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Proof URL / GitHub Repo Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={editingAch.proof_url || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, proof_url: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="PyTorch, Wav2Vec2, Speech AI"
                    value={Array.isArray(editingAch.tags) ? editingAch.tags.join(", ") : editingAch.tags || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, tags: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={editingAch.is_featured ?? true}
                    onChange={(e) => setEditingAch({ ...editingAch, is_featured: e.target.checked })}
                    className="rounded border-white/20"
                  />
                  <label htmlFor="is_featured" className="text-white/80 cursor-pointer">
                    Feature on Portfolio Timeline
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAchModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-300 text-black font-bold hover:bg-white transition-colors"
                  >
                    Save Achievement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BLOG / THOUGHT MODAL */}
      <AnimatePresence>
        {isBlogModalOpen && editingBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl p-6 rounded-3xl bg-[#0c0c11] border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">
                    {editingBlog.id ? "Edit Blog Post" : "Publish Engineering Thought"}
                  </h3>
                  <div className="flex items-center bg-black rounded-lg p-0.5 border border-white/10 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setBlogPreviewMode(false)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        !blogPreviewMode ? "bg-red-300 text-black font-bold" : "text-white/50"
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogPreviewMode(true)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        blogPreviewMode ? "bg-red-300 text-black font-bold" : "text-white/50"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsBlogModalOpen(false)}
                  className="text-white/40 hover:text-white text-xs font-mono"
                >
                  [ESC / CLOSE]
                </button>
              </div>

              {!blogPreviewMode ? (
                <form onSubmit={handleSaveBlog} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-white/60 block mb-1">Post Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Architecting GraphRAG Copilots with AST Code Maps"
                      value={editingBlog.title || ""}
                      onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 block mb-1">Executive Summary *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Short teaser or overview for social cards and listings..."
                      value={editingBlog.summary || ""}
                      onChange={(e) => setEditingBlog({ ...editingBlog, summary: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 block mb-1">Cover Image URL</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={editingBlog.cover_image || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, cover_image: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 block mb-1">External Link (Optional)</label>
                      <input
                        type="url"
                        placeholder="e.g. Medium, Substack or Dev.to URL"
                        value={editingBlog.external_url || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, external_url: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 block mb-1">Full Markdown Content</label>
                    <textarea
                      rows={8}
                      placeholder="# Your engineering thoughts, code blocks, diagrams..."
                      value={editingBlog.content || ""}
                      onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none font-mono leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 block mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="AI Agents, GraphRAG, Architecture"
                        value={Array.isArray(editingBlog.tags) ? editingBlog.tags.join(", ") : editingBlog.tags || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, tags: e.target.value as any })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 block mb-1">Read Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 4 min read"
                        value={editingBlog.read_time || "3 min read"}
                        onChange={(e) => setEditingBlog({ ...editingBlog, read_time: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={editingBlog.is_published ?? true}
                      onChange={(e) => setEditingBlog({ ...editingBlog, is_published: e.target.checked })}
                      className="rounded border-white/20"
                    />
                    <label htmlFor="is_published" className="text-white/80 cursor-pointer">
                      Publish immediately to public `/blogs`
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsBlogModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-red-300 text-black font-bold hover:bg-white transition-colors"
                    >
                      Save & Publish
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 py-4">
                  <h1 className="text-2xl font-bold text-white">{editingBlog.title || "Untitled Post"}</h1>
                  <p className="text-sm text-white/60 italic">{editingBlog.summary}</p>
                  {editingBlog.cover_image && (
                    <img
                      src={editingBlog.cover_image}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-xl border border-white/10"
                    />
                  )}
                  <div className="p-6 rounded-2xl bg-black/60 border border-white/10">
                    <MarkdownRenderer content={editingBlog.content || "No markdown body provided."} />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
