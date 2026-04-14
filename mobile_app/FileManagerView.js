import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View, FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const palette = {
  bg: '#f0f2f0',
  panel: '#ffffff',
  text: '#1f2f28',
  muted: '#5f726a',
  border: '#d8e4de',
  accent: '#165132',
  accentSoft: '#eaf5ef',
};

const FileManagerView = ({ t }) => {
  const [selectedCourse, setSelectedCourse] = useState('biodiversity');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: 'Biodiversity Module 1.pdf', course: 'biodiversity', size: '2.3 MB', uploaded: '2024-01-15' },
    { id: 2, name: 'Training Notes.docx', course: 'biodiversity', size: '145 KB', uploaded: '2024-01-10' },
    { id: 3, name: 'Field Guide Video.mp4', course: 'field-training', size: '15.2 MB', uploaded: '2024-01-08' },
  ]);

  const courses = [
    { key: 'biodiversity', label: 'Biodiversity' },
    { key: 'field-training', label: 'Field Training' },
    { key: 'lab-skills', label: 'Lab Skills' },
  ];

  const handleUpload = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      // Mock upload
      setTimeout(() => {
        setFiles(prev => [{
          id: Date.now(),
          name: result.assets[0].name,
          course: selectedCourse,
          size: (result.assets[0].size / 1024 / 1024).toFixed(1) + (result.assets[0].size < 1024 ? ' KB' : ' MB'),
          uploaded: new Date().toISOString().slice(0, 10),
        }, ...prev.slice(0, 20)]); // Limit to 20 files
        Alert.alert('Success', 'File uploaded successfully!');
        setUploading(false);
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Upload failed.');
      setUploading(false);
    }
  };

  const handleDownload = (fileName) => {
    Alert.alert('Download', `Downloading ${fileName}... (Demo)`);
  };

  const renderFileCard = ({ item }) => (
    <Pressable 
      style={({pressed}) => [{
        backgroundColor: palette.panel,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 12,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }]}
      onPress={() => handleDownload(item.name)}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text, marginBottom: 8 }}>
        {item.name}
      </Text>
      <Text style={{ fontSize: 14, color: palette.muted, marginBottom: 4 }}>
        Course: {item.course.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Text>
      <Text style={{ fontSize: 14, color: palette.muted, marginBottom: 4 }}>
        Size: {item.size}
      </Text>
      <Text style={{ fontSize: 14, color: palette.muted }}>
        Uploaded: {item.uploaded}
      </Text>
      <Pressable 
        style={({pressed}) => [{
          backgroundColor: pressed ? palette.accent : '#165132',
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignSelf: 'flex-start',
          marginTop: 12,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }]}
        onPress={() => handleDownload(item.name)}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Download</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '900', color: palette.text, marginBottom: 8 }}>
        Training Files
      </Text>
      <Text style={{ fontSize: 16, color: palette.muted, marginBottom: 24 }}>
        Upload and manage files for your courses
      </Text>

      {/* Upload Section - Adapted from user_page upload-section */}
      <View style={{
        backgroundColor: palette.panel,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 16 }}>
          Upload New File
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 16, color: palette.text, minWidth: 60 }}>Course:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {courses.map(course => (
              <Pressable
                key={course.key}
                style={({pressed}) => [{
                  backgroundColor: selectedCourse === course.key ? palette.accent : palette.accentSoft,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: palette.border,
                  opacity: pressed ? 0.8 : 1,
                }]}
                onPress={() => setSelectedCourse(course.key)}
              >
                <Text style={{
                  color: selectedCourse === course.key ? '#fff' : palette.text,
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                  {course.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({pressed}) => [{
            backgroundColor: uploading ? palette.muted : palette.accent,
            borderRadius: 12,
            padding: 14,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
            opacity: pressed ? 0.9 : 1,
          }]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {uploading ? 'Uploading...' : 'Choose File'}
          </Text>
        </Pressable>
      </View>

      {/* Files Grid - Responsive single column */}
      <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: 16 }}>
        Your Files ({files.length})
      </Text>

      <FlatList
        data={files}
        renderItem={renderFileCard}
        keyExtractor={item => item.id.toString()}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {files.length === 0 && (
        <View style={{
          backgroundColor: palette.panel,
          borderColor: palette.border,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderRadius: 16,
          padding: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 16, color: palette.muted, textAlign: 'center', fontWeight: '600' }}>
            No files yet
          </Text>
          <Text style={{ fontSize: 14, color: palette.muted, textAlign: 'center', marginTop: 8 }}>
            Upload your first course file above
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default FileManagerView;

