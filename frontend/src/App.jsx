import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [view, setView] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.get(API_BASE + "/api/results/" + rollNumber.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Result not found. Verify your roll number.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await axios.post(API_BASE + "/api/admin/login", { username, password });
      if (res.data.token) {
        setIsAdminLoggedIn(true);
      }
    } catch (err) {
      setLoginError("Invalid exam cell ID or password.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadMsg("Uploading and processing...");
    try {
      const res = await axios.post(API_BASE + "/api/admin/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": "Bearer valid_exam_cell_token_xyz"
        }
      });
      setUploadMsg(res.data.message);
    } catch (err) {
      setUploadMsg(err.response?.data?.detail || "Upload failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h1 className="font-semibold text-lg tracking-wide">University Exam Portal</h1>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => { setView("student"); setError(""); setResult(null); }}
              className={"px-3 py-1 text-xs font-medium rounded-md transition-all " + (view === "student" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              Student
            </button>
            <button
              onClick={() => { setView("admin"); setUploadMsg(""); }}
              className={"px-3 py-1 text-xs font-medium rounded-md transition-all " + (view === "admin" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="p-6">
          {view === "student" ? (
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-1">Check Semester Results</h2>
              <p className="text-xs text-slate-500 mb-4">Enter your official registration or roll number.</p>
              
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 22CS101"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {result && (
                <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-medium">Candidate Name</span>
                    <span className="text-xs font-semibold text-slate-800">{result.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-medium">Roll Number</span>
                    <span className="text-xs font-semibold text-slate-800">{result.roll_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-medium">Semester</span>
                    <span className="text-xs font-semibold text-slate-800">{result.semester}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-medium">SGPA</span>
                    <span className="text-xs font-semibold text-slate-800">{result.sgpa}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-xs text-slate-500 font-medium">Final Status</span>
                    <span className={"text-xs font-bold uppercase tracking-wider " + (result.status.toLowerCase() === "pass" ? "text-emerald-600" : "text-rose-600")}>
                      {result.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {!isAdminLoggedIn ? (
                <div>
                  <h2 className="text-base font-semibold text-slate-800 mb-1">Exam Cell Restricted Login</h2>
                  <p className="text-xs text-slate-500 mb-4">Enter your authorized staff ID and password to continue.</p>
                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Staff ID / Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    {loginError && (
                      <p className="text-xs text-rose-600">{loginError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Authenticate
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-semibold text-slate-800">Publish Examination Results</h2>
                    <button 
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Logout
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload an Excel file (.xlsx) with columns: <strong>roll_number, name, semester, sgpa, status</strong>.
                  </p>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-lg cursor-pointer p-1"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Upload & Publish Batch
                    </button>
                  </form>

                  {uploadMsg && (
                    <div className="mt-4 p-3 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg">
                      {uploadMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

