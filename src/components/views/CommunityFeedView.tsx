import React, { useState } from 'react';

interface FeedPost {
  id: string;
  author: string;
  role: string;
  avatar: string;
  badge?: string;
  timeAgo: string;
  title: string;
  description: string;
  category: string;
  location: string;
  upvotes: number;
  commentsCount: number;
  hasUpvoted?: boolean;
  status: 'In Progress' | 'Escalated' | 'Resolved' | 'SLA Breach';
  statusColor: string;
  agency: string;
  verifiedOtp?: boolean;
  evidenceImage?: string;
  comments: { author: string; role: string; text: string; time: string }[];
}

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    author: 'Dr. Radhika Rao',
    role: 'Indiranagar 1st Stage RWA Lead',
    avatar: 'RR',
    badge: 'Verified Citizen #112',
    timeAgo: '18 mins ago',
    title: 'Emergency: High-Voltage 11kV Feeder Line Down outside NPS Gate 2',
    description:
      'Cable snapped during road excavation work and is sparking in standing water right as evening school pick-up began. We have cordoned off the footpath with bamboo sticks, but vehicles are spraying water across the wire. BESCOM crew needed urgently!',
    category: 'Electrical & Life Safety',
    location: '12th Main Rd, Indiranagar',
    upvotes: 289,
    commentsCount: 34,
    status: 'Escalated',
    statusColor: 'bg-red-100 text-red-800 border-red-300',
    agency: 'BESCOM QRU-41',
    verifiedOtp: true,
    evidenceImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQC91_Uqm7Ef2K5wf2imStaLAW5V0GuleOVwI9lWu-ZHMSzo1SoM2Oet62oZXa77C4T2oG8huiMMg9JJF_QK47mSgpZ2dTXwiUhv9ZGM14HpHv7qyIivSLchb3EOinaJnh_BeWQFr3ytNOPKCKSrDp_a9zzOcYN7qQN1xYsBU4pRNLw0HgEtEVT_JR4JCJBSVb6vGzeIXlc6QlZKXHBXwuEvvE3gUZMouJvzJiAts',
    comments: [
      {
        author: 'Inspector R. Sharma (Ward 112)',
        role: 'Municipal Command',
        text: 'Unit QRU-41 dispatched with 8-min ETA. Traffic police requested for intersection diversion.',
        time: '12m ago',
      },
      {
        author: 'Karthik N.',
        role: 'Resident',
        text: 'School buses are being re-routed via 100ft road. Please avoid 12th Main junction completely.',
        time: '5m ago',
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Vikram Somesh',
    role: 'Defence Colony Welfare Secretary',
    avatar: 'VS',
    badge: 'Civic Champion',
    timeAgo: '42 mins ago',
    title: 'Severe 36-inch BWSSB Water Main Burst flooding 100ft Road at 6th Cross',
    description:
      'Gushing potable water has submerged the left 2 lanes of 100ft road. Sub-surface erosion is clearly visible. Over 100,000 liters wasted already in the last 45 minutes.',
    category: 'Water & Pipeline',
    location: '100ft Rd, 6th Cross',
    upvotes: 194,
    commentsCount: 19,
    status: 'In Progress',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    agency: 'BWSSB East Division',
    verifiedOtp: true,
    evidenceImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD57AYkxqIJsx0gl6LHo8D6CbVZ97xC9IhohyvUUlalkZIEpxRmx5Zc5ReFv7ZRNfLA90G3GpsEjxHdQzMDI59QJpAzfS_NQOBKPYLn82psgpayAT-kR-3RNONLWksbq6_TbDiuTXe2g5pYf84agpVUCHNS4wIEd086aMBYs3lTLGM9H0Kg4yufZcWQhlHUb77CwiH1kMhCOT-dlSu6D0gRVUGV78hEgxworRBzzzk',
    comments: [
      {
        author: 'BWSSB Control Room',
        role: 'Agency Dispatch',
        text: 'Isolation valve #14 at HAL 2nd Stage being turned off. Crew arriving with suction pump.',
        time: '24m ago',
      },
    ],
  },
  {
    id: 'post-3',
    author: 'Ananya Hegde',
    role: 'CMH Road Traders Association',
    avatar: 'AH',
    timeAgo: '2 hrs ago',
    title: 'Deep Asphalt Crater at Metro Pillar 48 — Statutory Fine Triggered',
    description:
      'The 18cm pothole near Indiranagar Metro entrance caused two two-wheeler skids this morning. BBMP contractor has breached the 4-hour charter mandate; fine of ₹10,000 debited automatically.',
    category: 'Road Infrastructure',
    location: 'CMH Road Metro Pillar 48',
    upvotes: 142,
    commentsCount: 28,
    status: 'SLA Breach',
    statusColor: 'bg-red-100 text-red-800 border-red-300',
    agency: 'BBMP Infra Contractor #04',
    verifiedOtp: true,
    evidenceImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRnkcNxSflTwTJlH7Cn-TIOC93qYiD6OY4h9ts-cSO-FOS_Ireeh7wUMxr0MNfRDMttVXXV1yKuCC7hPk8p7MHycCp2Y6hksLR2XOhT6PCaEuw1ttE3Au3tulG1dZpR_RNz2W1OJVaUnXsuk2mlv9XxFaQph6hkkZ8t2KCJqgexnDq6DO7w5jyvdTswGXAjDkuYemon-FLJF5S5o9MPVcOOU-uUwS4PzsWpg7swfM',
    comments: [],
  },
];

export function CommunityFeedView() {
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);
  const [activeFilter, setActiveFilter] = useState<'Trending' | 'Most Supported' | 'Urgent' | 'Resolved'>('Trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');

  const handleUpvote = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasUpvoted = p.hasUpvoted;
        return {
          ...p,
          hasUpvoted: !hasUpvoted,
          upvotes: hasUpvoted ? p.upvotes - 1 : p.upvotes + 1,
        };
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [
            ...p.comments,
            {
              author: 'Inspector R. Sharma (Ward 112 Command)',
              role: 'Officer Verified',
              text,
              time: 'Just now',
            },
          ],
        };
      })
    );
    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: 'Inspector R. Sharma',
      role: 'Ward 112 Municipal Command',
      avatar: 'RS',
      badge: 'Command Officer',
      timeAgo: 'Just now',
      title: newPostTitle,
      description: newPostDesc || 'Community public notice issued by Ward 112 Command.',
      category: 'Civic Advisory',
      location: 'Ward 112 Central Grid',
      upvotes: 1,
      commentsCount: 0,
      hasUpvoted: true,
      status: 'In Progress',
      statusColor: 'bg-blue-100 text-blue-800 border-blue-300',
      agency: 'BBMP / Ward 112 Dispatch',
      verifiedOtp: true,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostDesc('');
    setShowNewPostModal(false);
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'Urgent') return p.status === 'Escalated' || p.status === 'SLA Breach';
    if (activeFilter === 'Resolved') return p.status === 'Resolved';
    return true;
  });

  return (
    <div className="w-full flex flex-col">
      {/* Top Action & Status Bar */}
      <div className="w-full bg-white border-b border-[#DCE3EE] px-4 lg:px-10 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#eff4fb] text-[#161c21] text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#0259c5]"></span>
                Democratic Citizen Telemetry
              </span>
              <span className="text-[#43474d] text-xs font-mono">BBMP Zone East • Sub-district 14</span>
            </div>
            <h1 className="text-2xl text-[#161c21] tracking-tight font-extrabold">
              Ward 112 Community Feed & Resident Accountability
            </h1>
            <p className="text-sm text-[#43474d] mt-0.5">
              Grassroots civic prioritization, verified neighborhood discussions, and public escalation backing across Indiranagar, Bengaluru.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#eff4fb] border border-[#d9e2ff] text-[#161c21] text-xs font-semibold">
              <span className="material-symbols-outlined text-[18px] text-[#0259c5]">verified_user</span>
              <span>Citizen Verification: Active (OTP 9845)</span>
            </button>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#011d34] text-white text-xs font-bold hover:bg-[#022c4d] transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_comment</span>
              <span>+ Start Public Discussion</span>
            </button>
          </div>
        </div>

        {/* Filter & Sort Sub-Row */}
        <div className="mt-4 pt-3 border-t border-[#e9eef5] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777e] text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#eff4fb] rounded-lg text-xs text-[#161c21] placeholder:text-[#74777e] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d9e2ff] transition-all border border-transparent focus:border-[#0259c5]"
              placeholder="Search neighborhood discussions, ticket IDs, or streets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eff4fb] text-[#161c21] text-xs font-semibold">
              <span className="material-symbols-outlined text-[#0259c5] text-[18px]">location_on</span>
              <span>Ward 112 (Indiranagar)</span>
            </div>
            <div className="flex items-center p-1 rounded-lg bg-[#eff4fb] gap-1">
              {(['Trending', 'Most Supported', 'Urgent', 'Resolved'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeFilter === filter
                      ? 'bg-white text-[#0259c5] shadow-sm'
                      : 'text-[#43474d] hover:text-[#161c21]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main 12-Column Content Canvas */}
      <div className="w-full px-4 lg:px-10 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Leaderboards & Neighborhood Stats (3 cols) */}
          <aside className="xl:col-span-3 flex flex-col gap-5">
            {/* Ward 112 Engagement Pulse */}
            <div className="p-5 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base text-[#161c21] font-bold">Engagement Pulse</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#d9e2ff] text-[#001a43] text-[11px] font-bold">
                  Live
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3 rounded-lg bg-[#eff4fb] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#43474d] uppercase font-bold">Active Verified</p>
                    <p className="text-xl font-extrabold text-[#161c21]">4,820</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0259c5] shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#eff4fb] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#43474d] uppercase font-bold">Community Backing</p>
                    <p className="text-xl font-extrabold text-[#161c21]">
                      1,420 <span className="text-xs font-normal text-[#43474d]">Issues</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0259c5] shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">thumbs_up_down</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#eff4fb] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#43474d] uppercase font-bold">Resolution Satisfaction</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-extrabold text-[#161c21]">89%</p>
                      <span className="text-xs text-[#0259c5] font-bold">+4.2% MoM</span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0259c5] shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                  </div>
                </div>
              </div>

              {/* Micro Sparkline */}
              <div className="p-3 rounded-lg bg-[#eff4fb] flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs text-[#43474d]">
                  <span>7-Day Escaped SLA Trends</span>
                  <span className="font-bold text-[#161c21]">94.1% on-time</span>
                </div>
                <svg className="w-full h-8 text-[#0259c5] overflow-visible" fill="none" viewBox="0 0 200 30">
                  <path
                    d="M0,22 Q20,18 40,24 T80,12 T120,16 T160,8 T200,4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <circle className="fill-[#0259c5] animate-ping" cx="200" cy="4" r="3.5" />
                  <circle className="fill-[#0259c5]" cx="200" cy="4" r="3" />
                </svg>
              </div>
            </div>

            {/* Top Civic Champions */}
            <div className="p-5 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#e9eef5]">
                <h2 className="text-base text-[#161c21] font-bold">Ward Champions</h2>
                <span className="text-[11px] text-[#43474d] font-semibold">Top 30d</span>
              </div>
              {[
                {
                  rank: 1,
                  avatar: 'RR',
                  name: 'Dr. Radhika Rao',
                  rwa: 'Indiranagar 1st Stage RWA',
                  verifs: '142 verifications',
                  resolved: '38 resolved',
                  color: 'bg-amber-400 text-black',
                },
                {
                  rank: 2,
                  avatar: 'VS',
                  name: 'Vikram Somesh',
                  rwa: 'Defence Colony Welfare Assn',
                  verifs: '96 verifications',
                  resolved: '24 resolved',
                  color: 'bg-slate-300 text-black',
                },
                {
                  rank: 3,
                  avatar: 'AH',
                  name: 'Ananya Hegde',
                  rwa: 'CMH Road Traders Guild',
                  verifs: '81 verifications',
                  resolved: '19 resolved',
                  color: 'bg-amber-700 text-white',
                },
              ].map((c) => (
                <div key={c.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#eff4fb] transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#011d34] text-white flex items-center justify-center font-bold text-xs">
                      {c.avatar}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${c.color}`}
                    >
                      {c.rank}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#161c21] truncate">{c.name}</p>
                    <p className="text-[11px] text-[#43474d] truncate">{c.rwa}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#43474d]">
                      <span className="text-[#0259c5] font-semibold">{c.verifs}</span>
                      <span>•</span>
                      <span>{c.resolved}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* CENTER / RIGHT COLUMN: Discussion Stream (9 cols) */}
          <main className="xl:col-span-9 flex flex-col gap-5">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* Author row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#011d34] text-white flex items-center justify-center font-bold text-xs">
                      {post.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#161c21]">{post.author}</span>
                        {post.badge && (
                          <span className="px-2 py-0.5 rounded bg-[#eff4fb] text-[#0259c5] text-[10px] font-bold">
                            {post.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#43474d]">
                        {post.role} • {post.timeAgo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${post.statusColor}`}>
                      {post.status}
                    </span>
                  </div>
                </div>

                {/* Title & Body */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-[#161c21] leading-snug">{post.title}</h3>
                  <p className="text-xs text-[#161c21] leading-relaxed">{post.description}</p>
                </div>

                {/* Meta details badge row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-[#eff4fb] text-[#161c21] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0259c5]">location_on</span>
                    {post.location}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#eff4fb] text-[#161c21] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0259c5]">category</span>
                    {post.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#eff4fb] text-[#001a43] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0259c5]">shield</span>
                    {post.agency}
                  </span>
                  {post.verifiedOtp && (
                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Cryptographic OTP Valid
                    </span>
                  )}
                </div>

                {/* Optional Evidence Image */}
                {post.evidenceImage && (
                  <div className="rounded-lg overflow-hidden border border-[#dde3ea] max-h-64 bg-slate-100">
                    <img
                      src={post.evidenceImage}
                      alt={post.title}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Interaction footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#e9eef5]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        post.hasUpvoted
                          ? 'bg-[#0259c5] text-white shadow'
                          : 'bg-[#eff4fb] hover:bg-[#dde3ea] text-[#161c21]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                      <span>{post.upvotes} Backers</span>
                    </button>
                    <span className="text-xs text-[#43474d] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">forum</span>
                      {post.commentsCount} Comments
                    </span>
                  </div>
                  <button className="text-xs text-[#0259c5] font-bold hover:underline flex items-center gap-1">
                    Share Incident Link
                    <span className="material-symbols-outlined text-[14px]">share</span>
                  </button>
                </div>

                {/* Comments Thread */}
                {post.comments.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#e9eef5]">
                    {post.comments.map((c, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#eff4fb] flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#161c21]">{c.author}</span>
                          <span className="text-[10px] text-[#43474d]">{c.time}</span>
                        </div>
                        <p className="text-xs text-[#161c21]">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCommentText[post.id] || ''}
                    onChange={(e) =>
                      setNewCommentText({ ...newCommentText, [post.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(post.id);
                    }}
                    placeholder="Add verified citizen or command comment..."
                    className="flex-1 px-3 py-2 bg-[#eff4fb] border border-[#d9e2ff] rounded-lg text-xs text-[#161c21] placeholder:text-[#74777e] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d9e2ff]"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="px-3.5 py-2 rounded-lg bg-[#011d34] text-white text-xs font-bold hover:bg-[#022c4d]"
                  >
                    Reply
                  </button>
                </div>
              </article>
            ))}
          </main>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 border border-[#DCE3EE]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#161c21]">Start Ward 112 Public Discussion</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-[#43474d] hover:text-[#161c21]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-[#43474d] uppercase">Discussion Topic / Header</label>
                <input
                  type="text"
                  required
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="e.g. Storm water drain blockage near 13th Cross"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[#c3c6cd] text-xs text-[#161c21] focus:outline-none focus:border-[#0259c5]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#43474d] uppercase">Incident Narrative & Location</label>
                <textarea
                  rows={4}
                  value={newPostDesc}
                  onChange={(e) => setNewPostDesc(e.target.value)}
                  placeholder="Provide precise location, severity, and neighborhood impact..."
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[#c3c6cd] text-xs text-[#161c21] focus:outline-none focus:border-[#0259c5]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#eff4fb] text-xs font-semibold text-[#161c21]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#011d34] text-white text-xs font-bold hover:bg-[#022c4d]"
                >
                  Publish Public Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
