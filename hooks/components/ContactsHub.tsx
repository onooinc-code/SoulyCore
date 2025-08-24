import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import type { Contact } from '../../types';
import { dbService } from '../context/db/db';
import { motion } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, EditIcon, UploadIcon } from './Icons';

interface ContactsHubProps {
    setIsOpen: (isOpen: boolean) => void;
}

const ContactsHub: React.FC<ContactsHubProps> = ({ setIsOpen }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<Partial<Contact> | null>(null);

    const fetchContacts = useCallback(async () => {
        const allContacts = await dbService.contacts.getAll();
        setContacts(allContacts.sort((a, b) => a.name.localeCompare(b.name)));
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
        const contactToSave: Contact = {
            id: currentContact.id || crypto.randomUUID(),
            createdAt: currentContact.createdAt || new Date(),
            name: currentContact.name,
            email: currentContact.email || '',
            company: currentContact.company || '',
            tags: Array.isArray(currentContact.tags) ? currentContact.tags : (currentContact.tags as any)?.split(',').map((t: string) => t.trim()) || [],
            notes: currentContact.notes || '',
        };

        if (currentContact.id) {
            await dbService.contacts.update(contactToSave);
        } else {
            await dbService.contacts.add(contactToSave);
        }
        await fetchContacts();
        setIsFormOpen(false);
        setCurrentContact(null);
    };

    const handleDeleteContact = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            await dbService.contacts.delete(id);
            await fetchContacts();
        }
    };

    const handleFileAnalysis = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                // In a real scenario, this would be sent to a specialized agent.
                alert(`Analysis Tool (Placeholder):\n\nThis would send the ${file.name}'s content to an AI to extract action items, dates, and other details.\n\nContent:\n${text.substring(0, 200)}...`);
            };
            reader.readAsText(file);
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col p-6"
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Contacts Hub</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                        <PlusIcon className="w-5 h-5" /> Add Contact
                    </button>
                    <div>
                        <input type="file" id="file-analyzer" accept=".txt" onChange={handleFileAnalysis} className="hidden" />
                        <label htmlFor="file-analyzer" className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm">
                            <UploadIcon className="w-5 h-5" /> Analyze Conversation
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {isFormOpen && (
                         <div className="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">
                            <h3 className="font-semibold">{currentContact?.id ? 'Edit Contact' : 'New Contact'}</h3>
                            <input value={currentContact?.name || ''} onChange={e => setCurrentContact({...currentContact, name: e.target.value})} placeholder="Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <input value={currentContact?.email || ''} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} placeholder="Email" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <input value={currentContact?.company || ''} onChange={e => setCurrentContact({...currentContact, company: e.target.value})} placeholder="Company" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <input value={Array.isArray(currentContact?.tags) ? currentContact.tags.join(', ') : ''} onChange={e => setCurrentContact({...currentContact, tags: e.target.value.split(',').map(t=>t.trim())})} placeholder="Tags (comma-separated)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <textarea value={currentContact?.notes || ''} onChange={e => setCurrentContact({...currentContact, notes: e.target.value})} placeholder="Notes" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                            <div className="flex gap-2">
                                <button onClick={handleSaveContact} className="flex-1 p-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                                <button onClick={() => setIsFormOpen(false)} className="flex-1 p-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                            </div>
                        </div>
                    )}
                    <ul className="space-y-2">
                        {contacts.map(contact => (
                            <li key={contact.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{contact.name} <span className="text-sm font-normal text-gray-400">- {contact.company}</span></p>
                                    <p className="text-sm text-gray-300">{contact.email}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleOpenForm(contact)}><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                    <button onClick={() => handleDeleteContact(contact.id)}><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ContactsHub;
