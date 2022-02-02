const inquirer = require('inquirer');
const mysql = require('mysql2');
// var AsciiTable = require('ascii-table');


const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      port: 3306,
      password: 'password',
      database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
);

// var departmentList = [];
var questionSets = {
    continue: [
        {
            name: "continue",
            type: "confirm",
            message: "Continue?",
        }
    ],
    welcome : [
        {
            type: 'list',
            message: 'What would you like to do?',
            name: 'whatToDo',
            choices: [
                'View All Employees', 
                'Add Employee', 
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department',
                'Quit'
            ]
        }
    ],
    addDepartment : [
        {
            type: 'input',
            message: 'Please enter the department name.',
            name: 'departmentName'      
        }
    ],
    addRole : [
        {
            type : 'input',
            message: 'Please enter the name of the role.',
            name : 'roleName'
        },{
            type : 'input',
            message: 'Please enter the salary of this role.',
            name : 'salary'
        },{
            type: 'list',
            message: 'Which department is this role located in?',
            name: 'department',
            choices: []
                
            
        }
    ],
    addEmployee : [
        {
            type : 'input',
            message: 'Please enter employee\'s first name',
            name : 'firstName'
        },{
            type : 'input',
            message: 'Please enter employee\'s last name',
            name : 'lastName'
        },{
            type: 'list',
            message: 'Please enter employee\'s role',
            name: 'role',
            choices: [],
            filter(answer) {
                const id = answer.match(/[1-9]/g).join('');
                return id;
            } 
        },{
            type: 'list',
            message: 'Please enter employee\'s manager',
            name: 'manager',
            choices: [],
            filter(answer) {
                const id = answer.match(/[1-9]/g).join('');
                return id;
            } 
        }
    ],
    updateEmployeeRole : [
        {
            type: 'list',
            message: 'Please select employee',
            name: 'name',
            choices: [],
            filter(answer) {
                const id = answer.match(/[1-9]/g).join('');
                return id;
            } 
        },{
            type: 'list',
            message: 'Please enter the employee\'s new role',
            name: 'role',
            choices: [],
            filter(answer) {
                const id = answer.match(/[1-9]/g).join('');
                return id;
            } 
        }
    ]
};



function askQuestion(questionSet) {
    console.log('\n');
    inquirer
        .prompt(questionSet)
        .then((response) => {
            console.log(response);
             if (response.continue) {   
                askQuestion(questionSets.welcome);  
             }
             else if (response.departmentName) {
                console.debug('dept entered');
                queryDatabase(`INSERT INTO department (name) VALUES ("${response.departmentName}")`);
                
             }
             else if (response.firstName) {
                 console.debug('name entered');
                 queryDatabase(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("${response.firstName}", "${response.lastName}", "${response.role}",  "${response.manager}")`);
             }
             else if (response.roleName) {
                console.debug('role entered');
                console.log(response.department);
                db.query(`SELECT id FROM department WHERE department.name = ?`, response.department, function (err, results) {
                    const departmentId = results[0].id;
                    // console.log(results);
                    queryDatabase(`INSERT INTO role (title, salary, department_id) VALUES ("${response.roleName}", ${response.salary}, ${departmentId})`);
                });
                
             }
             else if (response.whatToDo) {
                switch (response.whatToDo) {
                    case 'Quit' : {
                        process.exit();
                    }
                    case 'Add Department' : {
                        askQuestion(questionSets.addDepartment);
                        break;
                    }
                    case 'Add Role' : {
            
                        
                        askQuestion(questionSets.addRole);
                        break;
                    }
                    case 'Add Employee' : {
                        askQuestion(questionSets.addEmployee);
                        break;
                    }
                    case 'Update Employee Role' : {
                        askQuestion(questionSets.updateEmployeeRole);
                        break;
                    }
                    case 'View All Employees' : {
                        queryDatabase(
                            'SELECT employee.id, CONCAT(employee.first_name," ", employee.last_name) AS Name, role.title AS "Job Title", department.name AS Department, role.salary AS Salary, CONCAT(manager.first_name, " ", manager.last_name) AS Manager FROM employee JOIN employee AS manager ON employee.manager_id = manager.id JOIN role ON employee.role_id = role.id JOIN department ON role.department_id = department.id'
                        );
                        break;
                    }
                    case 'View All Departments' : {
                        queryDatabase('SELECT name AS Department, id FROM department');
                        break;
                    }
                    case 'View All Roles' : {
                        queryDatabase('SELECT title AS Title, role.id, name AS Department, salary AS Salary FROM role JOIN department ON role.department_id = department.id');
                        break;
                    }
                    default : return response;
                }
            }
        });
}
function queryDatabase (command) {
    db.query(command , function (err, results) {
        if(results) {

            console.table(results);
            // console.log(results);
            updateQuestions();
            askQuestion(questionSets.continue);
     
                // let ascii = new AsciiTable();
                // ascii.setHeading(...parameters);
                // for (let i of results) {
                //     let row = [];
                //     for (let j of parameters) {
                //         row.push(i[j]);
                //     }
                //     ascii.addRow(...row);
                // }
                // console.log(ascii.toString());
         
        }
        if (err) console.error(err);
    });
}


//init
function updateQuestions() {
    let departmentList = [];
    let roleList = [];
    let employeeList = [];
    db.query('SELECT name FROM department', function (err, results) {
        
        for (let i of results) {
            departmentList.push(i.name);
        }
        // console.log(departmentList);
        questionSets.addRole[2].choices = departmentList;

    });
    db.query('SELECT CONCAT(title, " (id: ", id, ")") AS title FROM role', function (err, results) {
        for (let i of results) {
            roleList.push(i.title);
        }
        questionSets.addEmployee[2].choices = roleList;
        questionSets.updateEmployeeRole[1].choices = roleList;
    });
    db.query('SELECT CONCAT(first_name," ",last_name, " (id: ", id, ")") AS name FROM employee', function (err, results) {
        for (let i of results) {
            employeeList.push(i.name);
        }
        questionSets.addEmployee[3].choices = employeeList;
        questionSets.updateEmployeeRole[0].choices = employeeList;
    });
}
updateQuestions();
askQuestion(questionSets.welcome);



