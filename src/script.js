document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');

    const form = document.getElementById('todo-form');
    const editModal = document.getElementById('editModal');
    const closeModalButton = document.querySelector('.close-button');
    const saveEditButton = document.getElementById('saveEditButton');
    const addTaskForm = document.getElementById('todo-form');
    let currentTask;

    let tasks = await window.electron.loadTasks();
    console.log('Loaded tasks:', tasks);
    renderTasks(tasks);

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const titleInput = document.getElementById('todo-input');
        const newRmaNumber = titleInput.value.trim();
    
        if (newRmaNumber !== "") {
            // Check if the RMA number is unique
            const isRmaUnique = !tasks.some(task => task.rmaNumber === newRmaNumber);
            
            if (!isRmaUnique) {
                alert('This RMA number already exists! Please use a unique number.');
                return; // Prevent the task from being added
            }
    
            const newTask = {
                rmaNumber: newRmaNumber,
                productName: '',
                receivedDate: '',
                description: '',
                column: 'inProgress-column',
                dateModified: getTodaysDate()
            };
    
            tasks.push(newTask);
            renderTask(newTask);
            titleInput.value = "";
            window.electron.saveTasks(tasks);
        }
    });

    closeModalButton.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    saveEditButton.addEventListener('click', () => {
        const newTitle = document.getElementById('editInputTitle').value.trim();
        const newRmaNumber = document.getElementById('editInputRmaNumber').value.trim();
        const newReceivedDate = document.getElementById('editInputReceivedDate').value.trim();
        const newDescription = document.getElementById('editInputDescription').value.trim();
    
        if (newRmaNumber !== "") {
            // We need to preserve the current task's column while updating other fields
            const currentColumn = currentTask.column;  // Preserve the column value before making changes
    
            // Now update the task with new data (don't touch the column)
            currentTask.productName = newTitle;
            currentTask.rmaNumber = newRmaNumber;
            currentTask.receivedDate = newReceivedDate;
            currentTask.description = newDescription;
            currentTask.dateModified = getTodaysDate();
    
            // After updating, set the column back to what it was to preserve the task's place
            currentTask.column = currentColumn;
    
            // Now save the tasks and re-render them
            window.electron.saveTasks(tasks);
            renderTasks(tasks);
        }
    
        editModal.style.display = 'none';  // Close the modal after saving
    });
    
    function renderTasks(tasks) {
        const columns = document.querySelectorAll('.column');
        columns.forEach(column => column.innerHTML = ''); // Clear existing tasks
        tasks.forEach(task => renderTask(task));
    }

    function renderTask(task) {
        const taskElement = createTaskElement(task);
        console.log('Rendering task in column:', task.column);
        document.getElementById(task.column).appendChild(taskElement);
        initializeDragAndDrop(taskElement);
    }

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');

        const taskContent = document.createElement('div');
        taskContent.classList.add('task-content');
        taskContent.textContent = task.rmaNumber;

        const taskRMANumber = document.createElement('div');
        taskRMANumber.classList.add('task-content-small');
        taskRMANumber.textContent = 'Product: ' + task.productName;

        const taskReceivedDate = document.createElement('div');
        taskReceivedDate.classList.add('task-content-small');
        taskReceivedDate.textContent = 'Recieved: ' + task.receivedDate;

        const taskDateModified = document.createElement('div');
        taskDateModified.classList.add('task-content-small');
        taskDateModified.textContent = 'Last Modified: ' + task.dateModified;
        

        const taskButtons = document.createElement('div');
        taskButtons.classList.add('task-buttons');

        const editButton = document.createElement('button');
        editButton.classList.add('edit-button');
        editButton.textContent = 'View / Edit';
        editButton.addEventListener('click', () => {
            currentTask = task;
            document.getElementById('editInputRmaNumber').value = task.rmaNumber;
            document.getElementById('editInputTitle').value = task.productName;
            document.getElementById('editInputReceivedDate').value = task.receivedDate;
            document.getElementById('editInputDescription').value = task.description;
            editModal.style.display = 'block';
        });

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteTask(taskElement);
            tasks = tasks.filter(t => t !== task);
            window.electron.saveTasks(tasks);
        });

        taskButtons.appendChild(editButton);
        taskButtons.appendChild(deleteButton);
        taskElement.appendChild(taskContent);
        taskElement.appendChild(taskRMANumber);
        taskElement.appendChild(taskReceivedDate);
        taskElement.appendChild(taskDateModified);
        taskElement.appendChild(taskButtons);

        return taskElement;
    }

    function getTodaysDate(){
        const date = new Date();
            const formattedDate = date.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });

    console.log(formattedDate); // '18 Jan 2020, 18:20'
    return formattedDate;
    }

    function deleteTask(taskElement) {
        taskElement.remove();
    }

    function initializeDragAndDrop(taskElement) {
        taskElement.addEventListener('dragstart', () => {
            taskElement.classList.add('is-dragging');
        });
    
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('is-dragging');
            const columnId = taskElement.closest('.column').id;
            
            // Get the task object based on RMA number (unique identifier)
            const rmaNumber = taskElement.querySelector('.task-content').textContent.trim();
            const task = tasks.find(t => t.rmaNumber === rmaNumber);
            
            if (task) {
                task.column = columnId;  // Update the task's column
                task.dateModified = getTodaysDate(); //Update the task's dateModified NOT WORKING !!!!!!!
                window.electron.saveTasks(tasks);  // Save the updated tasks
            }
        });
    }
    

    const droppables = document.querySelectorAll(".column");

    droppables.forEach((zone) => {
        zone.addEventListener("dragover", (e) => {
            e.preventDefault();
            const bottomTask = insertAboveTask(zone, e.clientY);
            const curTask = document.querySelector(".is-dragging");

            if (!bottomTask) {
                zone.appendChild(curTask);
            } else {
                zone.insertBefore(curTask, bottomTask);
            }
        });
    });

    const insertAboveTask = (zone, mouseY) => {
        const els = zone.querySelectorAll(".task:not(.is-dragging)");

        let closestTask = null;
        let closestOffset = Number.NEGATIVE_INFINITY;

        els.forEach((task) => {
            const { top } = task.getBoundingClientRect();

            const offset = mouseY - top;

            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestTask = task;
            }
        });

        return closestTask;
    };
});