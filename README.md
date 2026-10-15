# 🏬 MallMate – Role-Based Mall Management System

**MallMate** is a web-based Mall Management System developed to centralize and simplify the day-to-day operations of a dedicated shopping mall. It provides a single platform for mall administrators, staff, shop owners, security personnel, and customers, with access controlled according to each user's role and permissions.

The application enables administrators to manage mall information and operations, shop owners to access their permitted shop-related features, staff and security personnel to perform their assigned responsibilities, and customers to discover shops and facilities, view announcements, and report incidents.

Built using **Java, Spring Boot, Spring Security, PostgreSQL, and REST APIs**, MallMate combines centralized mall management with secure authentication, role-based authorization, and customer-friendly features.

## 📊 Project Statistics

| **Metric** | **Details** |
|:--|:--|
| Project Type | Web-Based Mall Management System |
| Backend | Java, Spring Boot |
| Frontend | HTML, CSS, JavaScript |
| Database | PostgreSQL |
| User Roles | 5 |
| REST Controller Classes | 12 |
| REST API Endpoint Mappings | 79 |
| Security | Spring Security |
| Password Hashing | BCrypt |
| CSRF Protection | Spring Security |
| API Architecture | RESTful APIs |

*Endpoint count is based on the controller mappings in the current project backup. It represents controller mapping declarations, not necessarily 79 unique URLs, since different HTTP methods can share a URL.*

## 🎯 Project Objectives

- Centralize mall information and operational management in one application.
- Implement role-based access control so users can access only their permitted features.
- Simplify shop, floor, category, facility, and tenant management.
- Help customers discover shops and facilities more conveniently.
- Provide incident reporting and maintenance request management.
- Secure user accounts and sensitive operations using Spring Security.
- Provide REST APIs for communication between the frontend and backend.
- Establish a foundation that can be adapted to the operational requirements of different shopping malls.

## ✨ Key Features

### 🏪 Shop Management
- Add, view, update, search, and manage shop information.
- Maintain shop numbers, descriptions, opening hours, and operational status.
- Organize shops by floor and category.
- Associate shop owners with their assigned shops.
- Restrict shop management operations according to user permissions.

### 🏢 Floor and Shop Category Management
- Maintain floor information and shop categories.
- Organize mall shops in a structured manner.
- Make shop information easier to find and manage.

### 🛍️ Customer Portal
- Allow customers to register for an account.
- Browse and search available shops.
- Explore mall facilities.
- View public mall announcements.
- Report incidents through the available reporting functionality.
- Access customer-facing features without receiving administrative privileges.

### 🧑‍💼 User and Role Management
- Manage user accounts and assigned roles.
- Support role-specific access for Admin, Staff, Shop Owner, Security, and Customer.
- Allow authorized administrators to manage user accounts and shop-owner assignments.
- Restrict sensitive user-management operations to authorized roles.

### 📢 Announcement Management
- Create and maintain mall announcements.
- Make relevant public announcements available to customers.
- Support communication of mall-related information.

### 🚨 Incident Management
- Provide functionality for reporting incidents.
- Support authorized personnel in accessing and managing incident records.
- Help organize incident information for follow-up and operational coordination.

### 🔧 Maintenance Request Management
- Record maintenance requests related to mall operations.
- Support authorized users in viewing and managing requests.
- Help improve the organization of maintenance-related activities.

### 🔐 Secure Access Control
- Authenticate users before granting access to protected operations.
- Apply role-based authorization to backend endpoints.
- Hash passwords using BCrypt.
- Configure CSRF protection through Spring Security.
- Protect administrative functions from unauthorized access.

## 👥 User Roles and Permissions

MallMate follows the **Role-Based Access Control (RBAC)** approach. Each user receives access based on their assigned role.

| Role | Responsibilities |
|---|---|
| **Admin** | Manage users, roles, shops, floors, categories, tenants, facilities, announcements, and other authorized mall operations. |
| **Staff** | Access permitted operational features and perform assigned tasks, including incident reporting where authorized. |
| **Shop Owner** | Access assigned shop information and perform authorized shop-related operations. |
| **Security** | Access permitted security-related functions and report or manage incidents according to assigned permissions. |
| **Customer** | Register, browse shops, explore facilities, view public announcements, and report incidents through available customer-facing features. |

**Important:** Authorization is enforced by the backend, not just by hiding frontend buttons or pages. Customers cannot obtain administrative privileges simply by modifying a request or attempting to access a restricted URL.

## 🔒 Security Implementation

Security is a core component of MallMate. The application uses **Spring Security** to authenticate users and enforce role-based permissions on protected backend endpoints.

### 1. Authentication
Users authenticate before accessing protected features. Public customer registration and explicitly permitted public resources can remain accessible without an existing authenticated session.

### 2. Role-Based Authorization
Access is restricted according to assigned roles. For example, administrative operations are restricted to Admin, while Shop Owners can access specific shop-related functionality permitted by the security configuration.

### 3. BCrypt Password Hashing
MallMate uses `BCryptPasswordEncoder` to hash passwords before storing them. BCrypt is designed to make password verification secure and computationally expensive for attackers attempting to guess stored passwords.

Passwords should never be stored as plain text.

### 4. CSRF Protection
The application configures Cross-Site Request Forgery (CSRF) protection using Spring Security and `CookieCsrfTokenRepository`, together with a custom CSRF token request handler.

CSRF protection helps prevent unauthorized state-changing requests made through a user's authenticated browser. Requests that require CSRF validation must provide a valid token according to the configured security rules.

### 5. Backend-Enforced Permissions
Protected API operations are restricted through Spring Security request-matching and authorization rules. This helps prevent users from performing operations outside their assigned permissions, even if they attempt to call backend endpoints directly.

### 6. Controlled Administrative Operations
Sensitive operations, including user management and shop administration, are restricted to authorized roles. This separation helps protect mall data and maintain clear responsibilities among users.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Java | Core backend programming language |
| Spring Boot | Backend application development |
| Spring Web | REST API development |
| Spring Security | Authentication and role-based authorization |
| BCrypt | Password hashing |
| CSRF Protection | Protection against Cross-Site Request Forgery |
| Spring Data JPA | Database persistence and repository operations |
| Hibernate | Object-relational mapping |
| PostgreSQL | Relational database |
| HTML | Frontend page structure |
| CSS | Frontend styling and layout |
| JavaScript | Frontend interactions and API communication |
| Jakarta Bean Validation | Request data validation |
| Maven | Dependency management and build automation |
| Postman | API testing |

## 🏗️ Application Architecture

MallMate follows a layered backend architecture to separate responsibilities and make the application easier to maintain.

```text
Frontend
(HTML, CSS, JavaScript)
          |
          v
      REST APIs
          |
          v
     Controllers
          |
          v
         DTOs
          |
          v
       Services
          |
          v
     Repositories
          |
          v
       Entities
          |
          v
      PostgreSQL
```

Spring Security works across the request-processing flow to handle authentication, CSRF validation, and authorization before protected operations are executed.

### Main Backend Components

- **Controllers:** Handle HTTP requests and expose REST endpoints.
- **DTOs:** Define the request and response structures exchanged through the APIs.
- **Services:** Contain business logic and coordinate application operations.
- **Repositories:** Handle database access using Spring Data JPA.
- **Entities:** Represent the application's persistent data.
- **Security Configuration:** Defines access rules, password encoding, authentication behavior, and CSRF protection.
- **Global Exception Handling:** Helps provide consistent responses for application errors.

## 🔌 REST API Modules

The backend exposes REST endpoints across multiple controllers to support the application's different modules.

| Module | Purpose |
|---|---|
| Authentication | Support authentication-related operations |
| Customer Registration | Handle customer account registration |
| User Management | Manage user accounts and user-related operations |
| Role Management | Manage application roles |
| Shop Management | Create, retrieve, search, and update shop information |
| Floor Management | Manage mall floor information |
| Shop Category Management | Organize shops into categories |
| Tenant Management | Manage tenant-related information |
| Facility Management | Maintain mall facility information |
| Announcement Management | Manage mall announcements |
| Incident Management | Handle incident-related records |
| Maintenance Requests | Manage maintenance-related requests |

The project contains **79 controller endpoint mappings** across its 12 REST controller classes in the current backup.

## 💡 Use Cases

1. **Centralized Mall Administration:** An administrator can manage mall information and authorized operational activities through one platform.
2. **Customer Navigation:** Customers can search for shops, explore facilities, and access public announcements.
3. **Incident Reporting:** Customers and authorized personnel can report incidents using available application features.
4. **Shop Owner Access:** Shop owners can access their assigned shop information and authorized shop-related operations.
5. **Staff Operations:** Staff members can use the operational functions available to their roles.
6. **Security Coordination:** Security personnel can access permitted incident-related and security functions.
7. **Account Management:** Authorized administrators can manage users, shop owners, and role assignments.
8. **Maintenance Coordination:** Authorized users can record and manage maintenance requests.
9. **Secure Information Access:** Spring Security restricts protected operations according to each user's permissions.

## 🌟 Why MallMate?

Traditional mall operations may require separate processes to maintain shop information, manage tenants, communicate announcements, record incidents, and coordinate maintenance.

MallMate brings these functions together in a centralized application. It improves organization, gives each role a defined set of responsibilities, and helps customers find useful mall information more easily.

The system is designed for a dedicated mall and can be adapted for different malls by configuring their respective shops, floors, facilities, users, and operational requirements. Supporting multiple malls within a single shared deployment would require appropriate tenant separation and mall-specific authorization.

## 🚀 Getting Started

### Prerequisites

Install the following software before running the project:

- Java Development Kit (JDK) 25, matching the current project configuration
- PostgreSQL
- Maven, or use the included Maven Wrapper
- An IDE such as Visual Studio Code or IntelliJ IDEA
- Postman for testing REST APIs

### 1. Clone the Repository

```bash
git clone https://github.com/Yashika-Ramesh/MallMate.git
cd MallMate
```

If the Spring Boot application is inside a nested `mallmate` directory, navigate to that directory before running the following commands.

### 2. Create the Database

Create a PostgreSQL database for the application, for example:

```sql
CREATE DATABASE mallmate_db;
```

### 3. Configure Database Credentials

Update the database connection settings in `src/main/resources/application.properties` to match your local PostgreSQL configuration.

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mallmate_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

Configure `DB_USERNAME` and `DB_PASSWORD` in your local environment before running the application. Use the database and JPA settings already defined in your project, and do not commit real passwords or other secrets to GitHub.

### 4. Run the Application

On Windows, use the Maven Wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

Alternatively, if Maven is installed:

```bash
mvn spring-boot:run
```

### 5. Test the REST APIs

Once the application starts successfully, use Postman to test the available endpoints.

Check the controller mappings and Spring Security configuration to determine which endpoints are public and which require authentication, a CSRF token, or a particular role.

## 🔮 Future Enhancements

Potential enhancements include:

- A dedicated mall navigation interface with interactive floor maps.
- QR-code-based shop and facility discovery.
- Email or in-app notifications for announcements and incidents.
- Incident status tracking and reporting dashboards.
- Maintenance request prioritization and progress tracking.
- Analytics dashboards for mall operations.
- Multi-mall support with mall-specific data isolation and access control.
- Deployment to a cloud environment with production-ready configuration.

## 🎓 Learning Outcomes

This project provides practical experience with:

- Java and Spring Boot application development.
- REST API design and implementation.
- Layered architecture using controllers, services, repositories, DTOs, and entities.
- PostgreSQL database integration with Spring Data JPA and Hibernate.
- Authentication and role-based authorization using Spring Security.
- Password hashing using BCrypt.
- CSRF protection and secure request handling.
- Request validation and exception handling.
- API testing and backend integration.

## 📝 Conclusion

MallMate is a role-based Mall Management System that combines centralized mall administration, customer-facing functionality, operational coordination, and backend security in one application.

By integrating Spring Boot REST APIs with PostgreSQL and Spring Security, the project demonstrates how a real-world mall management application can organize information, enforce user permissions, protect account credentials, and make mall services more accessible.

**MallMate — One platform. Multiple roles. Smarter mall management.**