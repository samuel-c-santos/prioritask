import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, FlatList, StyleSheet, Modal, ScrollView, TouchableWithoutFeedback, BackHandler, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const App = () => {
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [taskDetails, setTaskDetails] = useState({
    date: new Date(),
    deadline: new Date(),
    involved: '',
    earnings: '',
    expenses: '',
    relatedTo: '',
    importance: 'Não Importante',
    urgency: 'Não Urgente',
    status: 'A Fazer',
    color: 'blue'
  });

// Salvar tarefas no AsyncStorage
const saveTasks = async () => {
  try {
    const jsonTasks = JSON.stringify(tasks);
    await AsyncStorage.setItem('@tasks', jsonTasks);
  } catch (e) {
    console.error('Erro ao salvar tarefas:', e);
  }
};

// Carregar tarefas do AsyncStorage
const loadTasks = async () => {
  try {
    const jsonTasks = await AsyncStorage.getItem('@tasks');
    if (jsonTasks) {
      setTasks(JSON.parse(jsonTasks));
    }
  } catch (e) {
    console.error('Erro ao carregar tarefas:', e);
  }
};


// Carregar tarefas ao iniciar o app
useEffect(() => {
  loadTasks();
}, []);

// Salvar tarefas sempre que o estado tasks for alterado
useEffect(() => {
  saveTasks();
}, [tasks]);

  useEffect(() => {
    const backAction = () => {
      if (menuVisible) {
        setMenuVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [menuVisible]);

  const handleAddOrUpdateTask = () => {
    const updatedTasks = [...tasks];
    const updatedTaskDetails = { ...taskDetails, color: getColor(taskDetails) };

    if (isEditing) {
      updatedTasks[currentTaskIndex] = { ...updatedTasks[currentTaskIndex], ...updatedTaskDetails, name: taskName };
    } else {
      updatedTasks.push({ ...updatedTaskDetails, name: taskName });
    }

    setTasks(updatedTasks);
    setModalVisible(false);
    resetTaskDetails();
  };

  const resetTaskDetails = () => {
    setTaskName('');
    setTaskDetails({
      date: new Date(),
      deadline: new Date(),
      involved: '',
      earnings: '',
      expenses: '',
      relatedTo: '',
      importance: 'Não Importante',
      urgency: 'Não Urgente',
      status: 'A Fazer',
      color: 'blue'
    });
    setIsEditing(false);
    setCurrentTaskIndex(null);
  };

  const handleEditTask = (index) => {
    const taskToEdit = tasks[index];
    setTaskName(taskToEdit.name);
    setTaskDetails(taskToEdit);
    setIsEditing(true);
    setCurrentTaskIndex(index);
    setModalVisible(true);
  };

  const handleDeleteTask = (index) => {
    Alert.alert(
      "Deletar Tarefa",
      "Tem certeza que deseja deletar esta tarefa?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Deletar",
          onPress: () => {
            const updatedTasks = tasks.filter((_, i) => i !== index);
            setTasks(updatedTasks);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  const filterTasks = (tasks, filter) => {
    let filteredTasks = tasks;

    if (filter !== 'All') {
      switch (filter) {
        case 'Faça Agora':
          filteredTasks = tasks.filter(task => task.importance === 'Importante' && task.urgency === 'Urgente');
          break;
        case 'Agende':
          filteredTasks = tasks.filter(task => task.importance === 'Importante' && task.urgency === 'Não Urgente');
          break;
        case 'Elimine':
          filteredTasks = tasks.filter(task => task.importance === 'Não Importante' && task.urgency === 'Não Urgente');
          break;
        case 'Delegue':
          filteredTasks = tasks.filter(task => task.importance === 'Não Importante' && task.urgency === 'Urgente');
          break;
        case 'A Fazer':
          filteredTasks = tasks.filter(task => task.status === 'A Fazer');
          break;
        case 'Fazendo':
          filteredTasks = tasks.filter(task => task.status === 'Fazendo');
          break;
        case 'Feito':
          filteredTasks = tasks.filter(task => task.status === 'Feito');
          break;
        default:
          break;
      }
    }

    if (startDate && endDate) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDeadline = new Date(task.deadline);
        return taskDeadline >= startDate && taskDeadline <= endDate;
      });
    }

    if (searchText) {
      filteredTasks = filteredTasks.filter(task =>
        task.name.toLowerCase().includes(searchText.toLowerCase()) ||
        task.relatedTo.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filteredTasks;
  };

  const getColor = (taskDetails) => {
    if (taskDetails.importance === 'Importante' && taskDetails.urgency === 'Urgente') {
      return 'red';
    }
    if (taskDetails.importance === 'Importante' && taskDetails.urgency === 'Não Urgente') {
      return 'yellow';
    }
    if (taskDetails.importance === 'Não Importante' && taskDetails.urgency === 'Não Urgente') {
      return 'green';
    }
    if (taskDetails.importance === 'Não Importante' && taskDetails.urgency === 'Urgente') {
      return 'blue';
    }
    return 'blue';
  };

  const getTotalEarnings = (tasks) => {
    return tasks.reduce((total, task) => total + (task.earnings ? parseFloat(task.earnings) : 0), 0);
  };

  const getCurrentMonthEarnings = (tasks) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return tasks
      .filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear && task.status === 'Feito';
      })
      .reduce((total, task) => total + (task.earnings ? parseFloat(task.earnings) : 0), 0);
  };

  const getTotalExpenses = (tasks) => {
    return tasks.reduce((total, task) => total + (task.expenses ? parseFloat(task.expenses) : 0), 0);
  };

  const getCurrentMonthExpenses = (tasks) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return tasks
      .filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear && task.status === 'Feito';
      })
      .reduce((total, task) => total + (task.expenses ? parseFloat(task.expenses) : 0), 0);
  };

  return (
    <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
            <Ionicons name="menu" size={32} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Prioritask</Text>
        </View>
        {menuVisible && (
          <View style={styles.menuContainer}>
            <Button title="Faça Agora" onPress={() => { setFilter('Faça Agora'); setMenuVisible(false); }} />
            <Button title="Agende" onPress={() => { setFilter('Agende'); setMenuVisible(false); }} />
            <Button title="Elimine" onPress={() => { setFilter('Elimine'); setMenuVisible(false); }} />
            <Button title="Delegue" onPress={() => { setFilter('Delegue'); setMenuVisible(false); }} />
            <Button title="Info" onPress={() => Alert.alert("Matriz de Eisenhower", "Tarefas importantes: são aquelas cujos resultados impactam diretamente as metas que você precisa cumprir e propósitos que deseja atingir.\n\nTarefas urgentes: costumam ter um prazo definido e exigem atenção imediata. Se não receberem o devido foco o quanto antes, pode haver consequências indesejáveis.")} />
          </View>
        )}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilter('A Fazer')}>
            <Text style={styles.filterText}>A Fazer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilter('Fazendo')}>
            <Text style={styles.filterText}>Fazendo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilter('Feito')}>
            <Text style={styles.filterText}>Feito</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowStartDatePicker(true)}>
            <Text style={styles.filterText}>Início do Prazo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowEndDatePicker(true)}>
            <Text style={styles.filterText}>Fim do Prazo</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.earningsCard}>
          <Text style={styles.earningsText}>Ganhos Possíveis este Mês: R$ {getTotalEarnings(tasks)}</Text>
          <Text style={styles.receivedEarningsText}>Ganhos Recebidos: R$ {getCurrentMonthEarnings(tasks)}</Text>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsText}>Despesas Previstas este Mês: R$ {getTotalExpenses(tasks)}</Text>
          <Text style={styles.expensesText}>Despesas Efetuadas: R$ {getCurrentMonthExpenses(tasks)}</Text>
        </View>
        <FlatList
          data={filterTasks(tasks, filter)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => handleEditTask(index)}>
              <View style={[styles.taskCard, { borderLeftColor: item.color }]}>
                <Text style={styles.taskName}>{item.name}</Text>
                <Text>{new Date(item.date).toDateString()}</Text>
                <Text>Envolvido: {item.involved}</Text>
                <Text>Ganhos: {item.earnings}</Text>
                <Text>Despesas: {item.expenses}</Text>
                <Text>Importância: {item.importance}</Text>
                <Text>Urgência: {item.urgency}</Text>
                <Text>Status: {item.status}</Text>
                <Text>Prazo: {new Date(item.deadline).toDateString()}</Text>
                <Text>Relacionado a: {item.relatedTo}</Text>
                <TouchableOpacity onPress={() => handleDeleteTask(index)}>
                  <Ionicons name="trash" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <Modal visible={modalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Tarefa' : 'Adicionar Tarefa'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da Tarefa"
                value={taskName}
                onChangeText={setTaskName}
              />
              <Text>Data:</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{taskDetails.date.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={taskDetails.date}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    setTaskDetails({ ...taskDetails, date: date || taskDetails.date });
                  }}
                />
              )}
              <Text>Prazo:</Text>
              <TouchableOpacity onPress={() => setShowDeadlinePicker(true)}>
                <Text style={styles.dateText}>{taskDetails.deadline.toDateString()}</Text>
              </TouchableOpacity>
              {showDeadlinePicker && (
                <DateTimePicker
                  value={taskDetails.deadline}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDeadlinePicker(false);
                    setTaskDetails({ ...taskDetails, deadline: date || taskDetails.deadline });
                  }}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Envolvidos"
                value={taskDetails.involved}
                onChangeText={(text) => setTaskDetails({ ...taskDetails, involved: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Ganhos (R$)"
                keyboardType="numeric"
                value={taskDetails.earnings}
                onChangeText={(text) => setTaskDetails({ ...taskDetails, earnings: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Despesas (R$)"
                keyboardType="numeric"
                value={taskDetails.expenses}
                onChangeText={(text) => setTaskDetails({ ...taskDetails, expenses: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Relacionado a"
                value={taskDetails.relatedTo}
                onChangeText={(text) => setTaskDetails({ ...taskDetails, relatedTo: text })}
              />
              <Picker
                selectedValue={taskDetails.importance}
                onValueChange={(itemValue) => setTaskDetails({ ...taskDetails, importance: itemValue })}
              >
                <Picker.Item label="Importante" value="Importante" />
                <Picker.Item label="Não Importante" value="Não Importante" />
              </Picker>
              <Picker
                selectedValue={taskDetails.urgency}
                onValueChange={(itemValue) => setTaskDetails({ ...taskDetails, urgency: itemValue })}
              >
                <Picker.Item label="Urgente" value="Urgente" />
                <Picker.Item label="Não Urgente" value="Não Urgente" />
              </Picker>
              <Picker
                selectedValue={taskDetails.status}
                onValueChange={(itemValue) => setTaskDetails({ ...taskDetails, status: itemValue })}
              >
                <Picker.Item label="A Fazer" value="A Fazer" />
                <Picker.Item label="Fazendo" value="Fazendo" />
                <Picker.Item label="Feito" value="Feito" />
              </Picker>
              <Button title={isEditing ? 'Atualizar Tarefa' : 'Adicionar Tarefa'} onPress={handleAddOrUpdateTask} />
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
            </ScrollView>
          </View>
        </Modal>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: '#fff',
    zIndex: 1,
    elevation: 5,
    padding: 10,
    borderRadius: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  filterText: {
    color: 'white',
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  earningsCard: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    marginBottom: 20,
  },
  earningsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  receivedEarningsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  expensesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
  taskCard: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#6200ee',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default App;
