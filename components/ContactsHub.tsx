


"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Contact } from '@/lib/types';
import { motion } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from './providers/LogProvider';

interface ContactsHubProps {
    setIsOpen: (isOpen: boolean) => void;
}

type SortKey = keyof Contact;

const ContactsHub: React.FC<ContactsHubProps> = ({ setIsOpen }) => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<Partial<Contact> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

    const fetchContacts = useCallback(async () => {
        clearError();
        log('Fetching all contacts...');
        try {
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const { contacts } = await res.json();
            setContacts(contacts);
            log(`Successfully fetched ${contacts.length} contacts.`);
        } catch (error) {
            const errorMessage = 'Could not load contacts.';
            setStatus({ error: errorMessage });
            log(errorMessage, { error: { message: (error as Error).message, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleOpenForm = (contact: Partial<Contact> | null = null) => {
        const action = contact ? 'edit' : 'new';
        log(`User opened contact form for ${action} contact.`, { contactId: contact?.id });
        setCurrentContact(contact || {});
        setIsFormOpen(true);
    };

    const handleSaveContact = async () => {
        if (!currentContact || !currentContact.name) return;
        clearError();
        const isUpdating = !!currentContact.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} contact...`, { contactData: currentContact });

        const url = isUpdating ? `/api/contacts/${currentContact.id}` : '/api/contacts';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentContact),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} contact`);
            
            const savedContact = await res.json();
            log(`Contact ${action.toLowerCase()}d successfully.`, { savedContact });
            await fetchContacts();
            setIsFormOpen(false);
            setCurrentContact(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} contact.`, { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            clearError();
            log(`Attempting to delete contact with ID: ${id}`);
            try {
                const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete contact');
                log('Contact deleted successfully.', { id });
                await fetchContacts();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete contact.', { id, error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
                console.error(error);
            }
        } else {
            log('User cancelled contact deletion.', { id });
        }
    };
    
    const sortedAndFilteredContacts = useMemo(() => {
        let sortableItems = [...contacts];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key] as any;
                const bVal = b[sortConfig.key] as any;
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems.filter(contact => 
            Object.values(contact).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [contacts, searchTerm, sortConfig]);
    
    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        log('User sorted contacts list', { key, direction });
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortKey; label: string }> = ({ sortKey, label }) => (
        <th className="p-3 text-left cursor-pointer" onClick={() => requestSort(sortKey)}>
            {label}
            {sortConfig.key === sortKey && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
        </th>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Contacts Hub</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                        <PlusIcon className="w-5 h-5" /> Add Contact
                    </button>
                    <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 bg-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                {isFormOpen && (
                     <div className="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">
                        <h3 className="font-semibold text-lg">{currentContact?.id ? 'Edit Contact' : 'New Contact'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input value={currentContact?.name || ''} onChange={e => setCurrentContact({...currentContact, name: e.target.value})} placeholder="Name (Required)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                           <input value={currentContact?.email || ''} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} placeholder="Email" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                           <input value={currentContact?.company || ''} onChange={e => setCurrentContact({...currentContact, company: e.target.value})} placeholder="Company" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                           <input value={currentContact?.phone || ''} onChange={e => setCurrentContact({...currentContact, phone: e.target.value})} placeholder="Phone" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                        </div>
                        <input
                            value={currentContact?.tags?.join(', ') || ''}
                            onChange={e => setCurrentContact({...currentContact, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                            placeholder="Tags (comma-separated)"
                            className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                        />
                        <textarea value={currentContact?.notes || ''} onChange={e => setCurrentContact({...currentContact, notes: e.target.value})} placeholder="Notes..." className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                        <div className="flex gap-2">
                            <button onClick={handleSaveContact} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Contact</button>
                            <button onClick={() => {
                                log('User cancelled contact form.');
                                setIsFormOpen(false);
                            }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                            <tr>
                                <SortableHeader sortKey="name" label="Name" />
                                <SortableHeader sortKey="company" label="Company" />
                                <SortableHeader sortKey="email" label="Email" />
                                <th className="p-3 text-left">Tags</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredContacts.map(contact => (
                                <motion.tr key={contact.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium">{contact.name}</td>
                                    <td className="p-3">{contact.company}</td>
                                    <td className="p-3">{contact.email}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {contact.tags?.map(tag => (
                                                <span key={tag} className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleOpenForm(contact)} title="Edit"><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                            <button onClick={() => handleDeleteContact(contact.id)} title="Delete"><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ContactsHub;