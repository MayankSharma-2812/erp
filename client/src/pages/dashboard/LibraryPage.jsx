import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  BookOpen,
  Search,
  PlusCircle,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  IndianRupee,
  RefreshCw,
  BookMarked,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [fines, setFines] = useState([]);
  const [students, setStudents] = useState([]);

  // Search/Filters
  const [searchBook, setSearchBook] = useState('');
  const [activeTab, setActiveTab] = useState('catalog');

  // Form states
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    authors: '',
    publisher: '',
    year: '',
    edition: '',
    subject: '',
    copies: '',
    location: '',
  });

  const [showIssue, setShowIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({
    bookId: '',
    studentId: '',
    dueDate: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchStudents();
  }, [searchBook]);

  useEffect(() => {
    if (activeTab === 'issues') fetchIssues();
    else if (activeTab === 'fines') fetchFines();
  }, [activeTab]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/library/books?search=${searchBook}`);
      if (res.data && res.data.success) {
        setBooks(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load books catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/students');
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/library/issues');
      if (res.data && res.data.success) {
        setIssues(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch book issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/library/fines');
      if (res.data && res.data.success) {
        setFines(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch library fines');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newBook,
        authors: newBook.authors.split(',').map(a => a.trim()),
        year: newBook.year ? parseInt(newBook.year) : undefined,
        copies: parseInt(newBook.copies),
      };
      const res = await axios.post('/library/books', formatted);
      if (res.data && res.data.success) {
        toast.success('Book cataloged successfully');
        setShowAddBook(false);
        setNewBook({
          isbn: '',
          title: '',
          authors: '',
          publisher: '',
          year: '',
          edition: '',
          subject: '',
          copies: '',
          location: '',
        });
        fetchBooks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to catalog book');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/library/issues', newIssue);
      if (res.data && res.data.success) {
        toast.success('Book issued successfully');
        setShowIssue(false);
        setNewIssue({ bookId: '', studentId: '', dueDate: '' });
        fetchBooks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    }
  };

  const handleReturnBook = async (issueId) => {
    try {
      const res = await axios.post(`/library/issues/${issueId}/return`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Book returned successfully');
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  const isLibrarian = user && (user.role === 'librarian' || user.role === 'principal');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Library Catalog & Issues</h1>
          <p className="text-gray-500 mt-1">Manage physical book inventories, issue logs, returns, and overdue fines.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Book Catalog
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'issues' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Check-outs & Returns
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'fines' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Overdue Fines
        </button>
      </div>

      {/* Main Area */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between gap-4 items-center">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search title, ISBN..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
              />
            </div>

            {isLibrarian && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddBook(true)}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Catalog Book
                </button>
                <button
                  onClick={() => setShowIssue(true)}
                  className="bg-indigo-55 text-indigo-700 font-semibold py-2 px-4 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 text-sm"
                >
                  <BookMarked className="w-4 h-4" /> Issue Book
                </button>
              </div>
            )}
          </div>

          {showAddBook && (
            <form onSubmit={handleAddBook} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Add New Book to Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">ISBN</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.isbn}
                    onChange={e => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Book Title</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.title}
                    onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Authors (comma separated)</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.authors}
                    onChange={e => setNewBook(prev => ({ ...prev, authors: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Publisher</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.publisher}
                    onChange={e => setNewBook(prev => ({ ...prev, publisher: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Copies count</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.copies}
                    onChange={e => setNewBook(prev => ({ ...prev, copies: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.subject}
                    onChange={e => setNewBook(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Rack / Shelf Location</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newBook.location}
                    onChange={e => setNewBook(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddBook(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Log Book
                </button>
              </div>
            </form>
          )}

          {showIssue && (
            <form onSubmit={handleIssueBook} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Issue Book</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Book</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newIssue.bookId}
                    onChange={e => setNewIssue(prev => ({ ...prev, bookId: e.target.value }))}
                  >
                    <option value="">Select Book</option>
                    {books.filter(b => b.available > 0).map(b => (
                      <option key={b._id} value={b._id}>{b.title} ({b.isbn})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Student Borrower</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newIssue.studentId}
                    onChange={e => setNewIssue(prev => ({ ...prev, studentId: e.target.value }))}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newIssue.dueDate}
                    onChange={e => setNewIssue(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowIssue(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Issue Check-out
                </button>
              </div>
            </form>
          )}

          {/* Books List Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Books...
              </div>
            ) : books.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">ISBN</th>
                      <th className="px-6 py-4">Authors</th>
                      <th className="px-6 py-4">Copies (Avail/Total)</th>
                      <th className="px-6 py-4">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {books.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{b.title}</td>
                        <td className="px-6 py-4 text-gray-500">{b.isbn}</td>
                        <td className="px-6 py-4 text-gray-600">{b.authors.join(', ')}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              b.available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {b.available} / {b.copies} available
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{b.location || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No books cataloged matching searches.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Active Check-outs</div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Loading Issues...
            </div>
          ) : issues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-4">Book Title</th>
                    <th className="px-6 py-4">Borrower</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {issues.map(iss => (
                    <tr key={iss._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{iss.book?.title}</td>
                      <td className="px-6 py-4 text-gray-650">
                        {iss.student?.name} (Adm No: {iss.student?.admissionNumber})
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(iss.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(iss.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            iss.status === 'returned'
                              ? 'bg-emerald-50 text-emerald-700'
                              : new Date() > new Date(iss.dueDate)
                              ? 'bg-rose-50 text-rose-700 animate-pulse'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {iss.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {iss.status === 'issued' && isLibrarian ? (
                          <button
                            onClick={() => handleReturnBook(iss._id)}
                            className="bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-100"
                          >
                            Return / Check-In
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No active book issues found.</div>
          )}
        </div>
      )}

      {activeTab === 'fines' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900 flex justify-between items-center">
            <span>Overdue Fines List</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Fine amount automatically links to student ledger
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Loading Fines...
            </div>
          ) : fines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Book Title</th>
                    <th className="px-6 py-4">Days Overdue</th>
                    <th className="px-6 py-4">Fine Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {fines.map(fine => (
                    <tr key={fine._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{fine.student?.name}</div>
                        <div className="text-xs text-gray-400">Adm No: {fine.student?.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{fine.issue?.book?.title}</td>
                      <td className="px-6 py-4 text-gray-650">{fine.days} days</td>
                      <td className="px-6 py-4 text-indigo-650 font-bold">₹{fine.amount}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                            fine.status === 'collected'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {fine.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No overdue fines recorded.</div>
          )}
        </div>
      )}
    </div>
  );
}
