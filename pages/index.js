import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';
import { UilHeart } from '@iconscout/react-unicons';
import { nanoid } from 'nanoid';
import { UilFileTimesAlt, UilHistory } from '@iconscout/react-unicons'
const id = nanoid(); // generate a new unique ID

function TrashBin({ notes, onDeleteNote, onRestoreNote }) {
  if (!notes) {
    return null;
  }
// comment
  const handleRestoreNote = (note) => {
    const confirmed = window.confirm(`Are you sure you want to restore ${note.title} from deleted?`);
    if (confirmed) {
      onRestoreNote(note);
    }
  };

  return (
    <div>
      {notes.map((note) => (
        <div key={note.id} className={styles.sidebarItemTrashy} onClick={() => handleRestoreNote(note)}>
          <button  className={styles.trashBinButton} title="Restore item">
            <UilHistory title="Restore item" className={styles.trashBinIcon}/>
          </button>
          <p className={styles.trashNoteTitle}>{note.title}</p>
        </div>
      ))}
    </div>
  );
}

function TrashBinModal({ isOpen, notes, onRestoreNote }) {
  return (
    <div>
      <TrashBin notes={notes} onRestoreNote={onRestoreNote} />
    </div>
  );
}


const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  { ssr: false }
);

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [notes, setNotes] = useLocalStorage('notes', []);
  const [newNote, setNewNote] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [deletedNotes, setDeletedNotes] = useLocalStorage('deletedNotes', []);
  const [selectedColorPair, setSelectedColorPair] = useState(['#335145', '#1e352f']);
  const [isModalOpen, setIsModalOpen] = useState(false);



  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleEditorChange = (content, editor) => {
    setNewNote(content);
  };

  const handleTitleChange = (event) => {
    setNewTitle(event.target.value);
  };

  const handleButtonClick = (event) => {
    event.preventDefault(); // prevent form submission
    if (newNote.trim() !== '' && newTitle.trim() !== '') {
      const existingNoteIndex = notes.findIndex(note => note.title === newTitle);
      if (existingNoteIndex !== -1) {
        const newNotes = [...notes];
        newNotes[existingNoteIndex] = { ...newNotes[existingNoteIndex], note: newNote };
        setNotes(newNotes);
      } else {
        const newNoteObj = { id: nanoid(), title: newTitle, note: newNote };
        setNotes([...notes, newNoteObj]);
      }
      setNewTitle('');
      setNewNote('');
    }
  };


  const handleRemoveButtonClick = (event) => {
    event.stopPropagation();
    if (selectedNoteIndex === null) {
      return; // no note is selected, do nothing
    }
    const deletedNote = notes[selectedNoteIndex];
    const shouldDelete = window.confirm(`Are you sure you want to delete the note "${deletedNote.title}"?`);
    if (shouldDelete) {
    const newNotes = [...notes];
      newNotes.splice(selectedNoteIndex, 1);
    setNotes(newNotes);
      setSelectedNoteIndex(null);
      setNewTitle('');
      setNewNote('');
      setDeletedNotes([...deletedNotes, deletedNote]);
    } else {
      setNewTitle(deletedNote.title);
      setNewNote(deletedNote.note);
    }
  };

  

  const handleNoteClick = (event, note, index) => {
    event.preventDefault();
    setSelectedNote(note.id);
    setNewTitle(note.title);
    setNewNote(note.note);
    setSelectedNoteIndex(index);
  };



  const handleNewNoteButtonClick = () => {
    setNewTitle('');
    setNewNote('');
    setSelectedNote(null);
    setSelectedNoteIndex(null);
  };
  

  const handleSaveButtonClick = () => {
    const newNotes = notes.map((note) => {
      if (note.id === selectedNote) {
        return { ...note, title: newTitle, note: newNote };
      } else {
        return note;
      }
    });
    setNotes(newNotes);
    setSelectedNote(null);
    setSelectedNoteIndex(null);
    setNewNote('');
  };
  
  const handleDeleteNote = (note) => {
    const newDeletedNotes = deletedNotes.filter((n) => n.id !== note.id);
    setDeletedNotes(newDeletedNotes);
  };
  
  const handleTrashBinClick = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleRestoreNote = (note) => {
    const newDeletedNotes = deletedNotes.filter((n) => n.id !== note.id);
    setDeletedNotes(newDeletedNotes);
    setNotes([...notes, note]);
  };
  



  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.container}>
        <div className={styles.sidebar} style={{ backgroundImage: `linear-gradient(to bottom, ${selectedColorPair[0]} 50%, ${selectedColorPair[1]})` }}>
        <div className={styles.appLogo}>
          NoteBook
          <UilHeart width={18} className={styles.logoIcon}/>
        </div>
        <div className={styles.sidebarNotesList}>
        <p className={styles.noteHeaderTitle}>Select Note</p>
        {notes.map((note, index) => (
    <div
      key={index}
      className={styles.sidebarItem}
      onClick={(event) => handleNoteClick(event, note, index)}
      title={note.title}
    >
            {note.title}
          </div>
        ))}
        </div>
      
      <div className={styles.trashHistory}>
            <button className={styles.trashBinButton} onClick={handleTrashBinClick}>
              <UilFileTimesAlt className={styles.trashBinIcon} />
              <span className={styles.trashBinText}>Recently Deleted</span>
            </button>
          <div className={styles.historyDeleted}>
            <TrashBinModal className={styles.trashBinButton} isOpen={isModalOpen} notes={deletedNotes} onRestoreNote={handleRestoreNote} />
          </div>
      </div>
          <div className={styles.themeButtons}>
            <span className={styles.themeButtonTitle}>Themes</span>
            <div className={styles.themeButtonContainer}>
            <button
              className={styles.themeButton}
              style={{ backgroundImage: `linear-gradient(to bottom, #703D57 20%, #402a2c)` }}
              onClick={() => setSelectedColorPair(['#703D57', '#402a2c'])}>
            </button>
            <button
              className={styles.themeButton}
              style={{ backgroundImage: `linear-gradient(to bottom, #335145 40%, #1e352f)` }}
              onClick={() => setSelectedColorPair(['#335145', '#1e352f'])}
            >
            </button>
            <button
              className={styles.themeButton}
              style={{ backgroundImage: `linear-gradient(to bottom, #124559 40%, #01161E)` }}
              onClick={() => setSelectedColorPair(['#124559', '#01161E'])}
            >
            </button>
            <button
              className={styles.themeButton}
              style={{ backgroundImage: `linear-gradient(to bottom, #950952 40%, #5e0035)` }}
              onClick={() => setSelectedColorPair(['#950952', '#5e0035'])}
            >
            </button>
            <button
              className={styles.themeButton}
              style={{ backgroundImage: `linear-gradient(to bottom, #31263E 40%, #221E22)` }}
              onClick={() => setSelectedColorPair(['#31263E', '#221E22'])}
            >
            </button>
            </div>
          </div>

      </div>
      <div className={styles.main}>
        {/* <div className={styles.headerBox}>
          <p className={styles.titleP}>Todo App</p>
        </div> */}
        <div className={styles.inputDiv}>
          <input className={styles.titleInput} type="text" placeholder="Title" value={newTitle} onChange={handleTitleChange} />
          <Editor
            apiKey="3s639nkdq31n86l81eye1orgt165wokgf4wtdkjljs9sdnld"
            init={{
              selector: 'textarea#premiumskinsandicons-snow',
              skin: 'snow',
              icons: 'thin',
              plugins: 'quickbars image lists code table codesample',
              toolbar: 'formatselect | forecolor backcolor | bold italic underline strikethrough | link image blockquote codesample | align bullist numlist | code ',
              height: 800,
              content_style: 'body { margin: 2rem 10%; }'
            }}
            value={newNote}
            onEditorChange={handleEditorChange}
            styles={{ border: 'transparent' }}

          />
          <div className={styles.saveNewButtons}>
          <button className={styles.newNoteButton} onClick={handleNewNoteButtonClick}>
              New Note
            </button>
            <button className={styles.submitNote} onClick={handleButtonClick}>
              Save
            </button>
            <button className={styles.removeNote} onClick={handleRemoveButtonClick}>
                    Delete Note
                  </button>
                </div>

          
          

                  

        </div>
        
      </div>
    </div>
  );
}