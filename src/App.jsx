import { useState, useEffect } from "react";
import { useSession } from "./context/SessionContext.jsx";
import Auth from "./components/Auth.jsx";
import { apiClient } from "./api/client.js";
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX } from "react-icons/fi";

export default function App() {
  const { user, authenticated, loading, logout } = useSession();
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Load notes when authenticated
  useEffect(() => {
    if (authenticated) {
      loadNotes();
    } else {
      setNotes([]);
      setLoadingNotes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  async function loadNotes() {
    try {
      setLoadingNotes(true);
      setError("");
      const result = await apiClient.readDocuments("notes");
      setNotes(result.documents || []);
    } catch (err) {
      setError(err.message);
      console.error("Load notes error:", err);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function createNote() {
    try {
      setError("");
      const newNote = {
        title: "Untitled",
        content: "Start writing...",
      };
      const created = await apiClient.createDocument("notes", newNote);
      setNotes([created, ...notes]);
    } catch (err) {
      setError(err.message);
      console.error("Create note error:", err);
    }
  }

  async function updateNote(id, updates) {
    try {
      setError("");
      await apiClient.updateDocument(id, updates);
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, data: { ...note.data, ...updates } } : note
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(err.message);
      console.error("Update note error:", err);
    }
  }

  async function deleteNote(id) {
    try {
      setError("");
      await apiClient.deleteDocument(id);
      setNotes(notes.filter((note) => note.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Delete note error:", err);
    }
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditContent(note.data.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Notion Demo</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Create Note Button */}
        <div className="mb-6">
          <button
            onClick={createNote}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            New Note
          </button>
        </div>

        {/* Notes List */}
        {loadingNotes ? (
          <div className="text-center text-gray-600">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No notes yet</p>
            <button
              onClick={createNote}
              className="text-blue-600 hover:text-blue-700"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {note.data.title || "Untitled"}
                  </h2>
                  <div className="flex items-center gap-2">
                    {editingId === note.id ? (
                      <>
                        <button
                          onClick={() =>
                            updateNote(note.id, { content: editContent })
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save"
                        >
                          <FiSave className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(note)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Note Content */}
                {editingId === note.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Write your note..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {note.data.content || "No content"}
                  </p>
                )}

                {/* Note Metadata */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Created: {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
