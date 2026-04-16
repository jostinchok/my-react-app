import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Picker } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const FilesPage = ({ t }) => {
  const [selectedCourse, setSelectedCourse] = useState('biodiversity');
  const [uploadFile, setUploadFile] = useState(null);
  const [files, setFiles] = useState([
    { id: 1, name: 'Biodiversity Module 1.pdf', course: 'biodiversity', size: '2.3 MB', uploaded: '2024-01-15' },
    { id: 2, name: 'Training Notes.docx', course: 'biodiversity', size: '145 KB', uploaded: '2024-01-10' },
    { id: 3, name: 'Field Guide Video.mp4', course: 'field-training', size: '15.2 MB', uploaded: '2024-01-08' },
  ]);

  const courses = [
    { value: 'biodiversity', label: 'Biodiversity' },
    { value: 'field-training', label: 'Field Training' },
    { value: 'lab-skills', label: 'Lab Skills' },
  ];

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/*', 'image/*'],
      });
      if (!result.canceled) {
        const file = result.assets[0];
        setUploadFile(file);
        // Simulate upload
        setTimeout(() => {
          setFiles(prev => [{
            id: Date.now(),
            name: file.name,
            course: selectedCourse,
            size: (file.size / 1024 / 1024).toFixed(1) + (file.size > 1024*1024 ? ' MB' : ' KB'),
            uploaded: new Date().toISOString().slice(0, 10),
          }, ...prev]);
          setUploadFile(null);
          Alert.alert('Success', 'File uploaded successfully!');
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed.');
    }
  };

  const handleDownload = (fileName) => {
    Alert.alert('Download', `Downloading ${fileName}... (Demo)`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.files || 'Training Files'} ({files.length})</Text>
        <Text style={styles.subtitle}>Manage your training materials</Text>
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload New File</Text>
        <View style={styles.uploadForm}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Course:</Text>
            <Picker
              selectedValue={selectedCourse}
              onValueChange={setSelectedCourse}
              style={styles.picker}
            >
              {courses.map(c => (
                <Picker.Item key={c.value} label={c.label} value={c.value} />
              ))}
            </Picker>
          </View>
          <Pressable onPress={handleUpload} style={styles.uploadBtn}>
            <Text style={styles.uploadBtnText}>Choose File</Text>
          </Pressable>
          {uploadFile && <Text style={styles.uploading}>Uploading {uploadFile.name}...</Text>}
        </View>
      </View>

      <View style={styles.filesSection}>
        <Text style={styles.sectionTitle}>Your Files</Text>
        <View style={styles.filesGrid}>
          {files.map(file => (
            <View key={file.id} style={styles.fileCard}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <View style={styles.fileMeta}>
                <Text style={styles.metaText}>Course: {file.course}</Text>
                <Text style={styles.metaText}>Size: {file.size}</Text>
                <Text style={styles.metaText}>Uploaded: {file.uploaded}</Text>
              </View>
              <Pressable onPress={() => handleDownload(file.name)} style={styles.downloadBtn}>
                <Text style={styles.downloadBtnText}>Download</Text>
              </Pressable>
            </View>
          ))}
        </View>
        {files.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No files yet. Upload your first file!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 24 },
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#1f2f28' },
  subtitle: { fontSize: 16, color: '#5f726a' },
  uploadSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#d8e4de' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1f2f28', marginBottom: 16 },
  uploadForm: { gap: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#d8e4de', borderRadius: 12, padding: 12, backgroundColor: '#f9f9f9' },
  pickerLabel: { fontWeight: '700', color: '#5f726a', marginBottom: 8 },
  picker: { height: 44 },
  uploadBtn: { backgroundColor: '#165132', padding: 16, borderRadius: 12, alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  uploading: { textAlign: 'center', color: '#165132', fontWeight: '600' },
  filesSection: { flex: 1 },
  filesGrid: { gap: 16 },
  fileCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#d8e4de',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileName: { fontSize: 16, fontWeight: '700', color: '#1f2f28', marginBottom: 12 },
  fileMeta: { gap: 4, marginBottom: 16 },
  metaText: { fontSize: 14, color: '#5f726a' },
  downloadBtn: { backgroundColor: '#165132', padding: 12, borderRadius: 10, alignItems: 'center' },
  downloadBtnText: { color: '#fff', fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#5f726a', textAlign: 'center' },
});

export default FilesPage;

