
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import * as monaco from 'monaco-editor';

const mockFileSystem: Record<string, string> = {
    '/src/index.tsx': `import React from 'react';\n// ...`,
    '/src/hooks/App.tsx': `import React from 'react';\n// ...`,
    '/src/types.ts': `export type Role = 'user' | 'model';\n// ...`,
    '/README.md': `# SoulyCore\n\nThis is an advanced AI assistant.`,
};

const CodeTerminal: React.FC = () => {
    const editorRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const terminalInstance = useRef<Terminal | null>(null);
    const fitAddon = useRef(new FitAddon());
    const [currentFile, setCurrentFile] = useState('/src/index.tsx');

    useEffect(() => {
        // Initialize Monaco Editor
        if (editorRef.current && !monacoInstance.current) {
            monacoInstance.current = monaco.editor.create(editorRef.current, {
                value: mockFileSystem[currentFile],
                language: 'typescript',
                theme: 'vs-dark',
                automaticLayout: true,
            });
        }

        // Initialize Xterm.js
        if (terminalRef.current && !terminalInstance.current) {
            const term = new Terminal({
                cursorBlink: true,
                theme: {
                    background: '#1f2937',
                    foreground: '#d1d5db',
                }
            });
            terminalInstance.current = term;
            term.loadAddon(fitAddon.current);
            term.open(terminalRef.current);
            fitAddon.current.fit();

            term.writeln('Welcome to SoulyCore Simulated Terminal!');
            term.writeln('Type `help` for a list of commands.');
            term.write('$ ');

            let command = '';
            term.onData(e => {
                switch (e) {
                    case '\r': // Enter
                        term.write('\r\n');
                        if (command) {
                            handleCommand(command);
                            command = '';
                        }
                        term.write('$ ');
                        break;
                    case '\u007F': // Backspace
                        if (command.length > 0) {
                            term.write('\b \b');
                            command = command.slice(0, -1);
                        }
                        break;
                    default:
                        command += e;
                        term.write(e);
                }
            });
        }
        
        return () => {
            // No cleanup needed for this component's lifecycle to avoid re-init issues
        };
    }, [currentFile]);

    useEffect(() => {
        if(monacoInstance.current) {
            monacoInstance.current.setValue(mockFileSystem[currentFile] || `// File not found: ${currentFile}`);
        }
    }, [currentFile]);

    const handleCommand = (cmd: string) => {
        const term = terminalInstance.current;
        if (!term) return;
        const [command, ...args] = cmd.split(' ');

        switch (command) {
            case 'help':
                term.writeln('Available commands: ls, cat [filename], clear');
                break;
            case 'ls':
                Object.keys(mockFileSystem).forEach(file => term.writeln(file));
                break;
            case 'cat':
                const content = mockFileSystem[args[0]];
                if (content) {
                    term.writeln(content.replace(/\n/g, '\r\n'));
                } else {
                    term.writeln(`cat: ${args[0]}: No such file or directory`);
                }
                break;
            case 'clear':
                term.clear();
                break;
            default:
                term.writeln(`${command}: command not found`);
        }
    };

    return (
        <div className="flex h-full gap-4">
            {/* File Tree */}
            <div className="w-1/4 bg-gray-800 rounded-lg p-2 overflow-y-auto">
                <h4 className="font-bold text-sm mb-2">File Explorer</h4>
                <ul>
                    {Object.keys(mockFileSystem).map(file => (
                        <li key={file}>
                            <button 
                                onClick={() => setCurrentFile(file)} 
                                className={`text-left w-full px-2 py-1 text-sm rounded ${currentFile === file ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                            >
                                {file}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Editor and Terminal */}
            <div className="w-3/4 flex flex-col gap-4">
                <div className="flex-1 min-h-0" ref={editorRef}></div>
                <div className="h-1/3 min-h-0 bg-gray-800 rounded-lg p-2" ref={terminalRef}></div>
            </div>
        </div>
    );
};

export default CodeTerminal;