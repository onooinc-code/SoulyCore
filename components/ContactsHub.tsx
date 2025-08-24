"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useMemo } from 'react';
import type { Contact } from '../lib/types';
import { motion } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, EditIcon, UploadIcon } from './Icons';

interface ContactsHubProps {
    setIsOpen: (isOpen: boolean) => void;
}

const ContactsHub: React.FC<ContactsHubProps> = ({ setIsOpen }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<Partial<Contact> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchContacts = useCallback(async () => {
        const res = await fetch('/api/contacts');
        if (res.ok) {
            const data = await res.json();
            setContacts(data.sort((a: Contact, b: Contact) => a.name.localeCompare(b.name)));
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleOpenForm = (contact: Partial<Contact> | null = null) => {
        setCurrentContact(contact || {});
        setIsFormOpen(true);
    };

    const handleSaveContact = async () => {
        if (!currentContact || !currentContact.name) return;
        
        const method = currentContact.id ? 'PUT' : 'POST';
        const url = currentContact.id ? `/api/contacts/${currentContact.id}` : '/api/contacts';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentContact),
        });

        await fetchContacts();
        setIsFormOpen(false);
        setCurrentContact(null);
    };

    const handleDeleteContact = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
            await fetchContacts();
        }
    };

    const filteredContacts = useMemo(() =>
        contacts.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.company?.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [contacts, searchTerm]
    );

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col p-6"
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Contacts Hub</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                            <PlusIcon className="w-5 h-5" /> Add Contact
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-2 bg-gray-700 rounded-lg text-sm"
                    />
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    {isFormOpen && (
                         <div className="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">
                            <h3 className="font-semibold">{currentContact?.id ? 'Edit Contact' : 'New Contact'}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input value={currentContact?.name || ''} onChange={e => setCurrentContact({...currentContact, name: e.target.value})} placeholder="Name*" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                <input value={currentContact?.email || ''} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} placeholder="Email" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                <input value={currentContact?.company || ''} onChange={e => setCurrentContact({...currentContact, company: e.target.value})} placeholder="Company" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                <input value={currentContact?.phone || ''} onChange={e => setCurrentContact({...currentContact, phone: e.target.value})} placeholder="Phone" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                <input value={currentContact?.linkedin_url || ''} onChange={e => setCurrentContact({...currentContact, linkedin_url: e.target.value})} placeholder="LinkedIn URL" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                <input value={Array.isArray(currentContact?.tags) ? currentContact.tags.join(', ') : ''} onChange={e => setCurrentContact({...currentContact, tags: e.target.value.split(',').map(t=>t.trim())})} placeholder="Tags (comma-separated)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                             </div>
                            <textarea value={currentContact?.notes || ''} onChange={e => setCurrentContact({...currentContact, notes: e.target.value})} placeholder="Notes" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                            <div className="flex gap-2">
                                <button onClick={handleSaveContact} className="flex-1 p-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                                <button onClick={() => setIsFormOpen(false)} className="flex-1 p-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                            </div>
                        </div>
                    )}
                    <table className="w-full text-left text-sm table-auto">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Company</th>
                                <th className="p-2">Email</th>
                                <th className="p-2">Phone</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.map(contact => (
                                <tr key={contact.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-2 font-medium">{contact.name}</td>
                                    <td className="p-2">{contact.company}</td>
                                    <td className="p-2">{contact.email}</td>
                                    <td className="p-2">{contact.phone}</td>
                                    <td className="p-2">
                                        <div className="flex gap-3">
                                            <button onClick={() => handleOpenForm(contact)}><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                            <button onClick={() => handleDeleteContact(contact.id)}><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ContactsHub;
