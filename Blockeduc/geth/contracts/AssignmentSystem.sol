// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract AssignmentSystem {
    
    // ==================== STRUCTURES ====================
    
    struct Assignment {
        uint256 assignmentId;
        address teacherAddress;
        string title;
        string description;
        uint256 deadline;
        string publicKeyRSA;
        string assignmentHash;
        uint256 createdAt;
        bool isActive;
    }
    
    struct Submission {
        uint256 submissionId;
        uint256 assignmentId;
        address studentAddress;
        string encryptedAnswer;
        string studentInfo;
        string submissionHash;
        uint256 submittedAt;
        bool isGraded;
    }
    
    struct Result {
        uint256 resultId;
        uint256 submissionId;
        uint256 grade;
        string comment;
        string resultHash;
        uint256 publishedAt;
    }
    
    struct AuditLog {
        uint256 logId;
        address actor;
        string action;
        uint256 timestamp;
        string details;
    }
    
    // ==================== STATE VARIABLES ====================
    
    uint256 public assignmentCounter;
    uint256 public submissionCounter;
    uint256 public resultCounter;
    uint256 public auditLogCounter;
    
    mapping(uint256 => Assignment) public assignments;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => Result) public results;
    mapping(uint256 => AuditLog) public auditLogs;
    
    // Mapping pour retrouver facilement les données
    mapping(address => uint256[]) public teacherAssignments;
    mapping(address => uint256[]) public studentSubmissions;
    mapping(uint256 => uint256[]) public assignmentSubmissions;
    
    // ==================== EVENTS ====================
    
    event AssignmentCreated(
        uint256 indexed assignmentId,
        address indexed teacher,
        string title,
        uint256 deadline
    );
    
    event SubmissionReceived(
        uint256 indexed submissionId,
        uint256 indexed assignmentId,
        address indexed student,
        uint256 timestamp
    );
    
    event ResultPublished(
        uint256 indexed resultId,
        uint256 indexed submissionId,
        uint256 grade
    );
    
    event AuditLogCreated(
        uint256 indexed logId,
        address indexed actor,
        string action
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyTeacher(uint256 _assignmentId) {
        require(
            assignments[_assignmentId].teacherAddress == msg.sender,
            "Only the teacher can perform this action"
        );
        _;
    }
    
    modifier assignmentExists(uint256 _assignmentId) {
        require(
            assignments[_assignmentId].createdAt > 0,
            "Assignment does not exist"
        );
        _;
    }
    
    modifier beforeDeadline(uint256 _assignmentId) {
        require(
            block.timestamp <= assignments[_assignmentId].deadline,
            "Deadline has passed"
        );
        _;
    }
    
    // ==================== FUNCTIONS ====================
    
    /**
     * @dev Créer un nouveau devoir
     */
    function createAssignment(
        string memory _title,
        string memory _description,
        uint256 _deadline,
        string memory _publicKeyRSA,
        string memory _assignmentHash
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        assignmentCounter++;
        uint256 newAssignmentId = assignmentCounter;
        
        assignments[newAssignmentId] = Assignment({
            assignmentId: newAssignmentId,
            teacherAddress: msg.sender,
            title: _title,
            description: _description,
            deadline: _deadline,
            publicKeyRSA: _publicKeyRSA,
            assignmentHash: _assignmentHash,
            createdAt: block.timestamp,
            isActive: true
        });
        
        teacherAssignments[msg.sender].push(newAssignmentId);
        
        // Log audit
        _createAuditLog(
            msg.sender,
            "CREATE_ASSIGNMENT",
            string(abi.encodePacked("Assignment ID: ", uintToString(newAssignmentId)))
        );
        
        emit AssignmentCreated(newAssignmentId, msg.sender, _title, _deadline);
        
        return newAssignmentId;
    }
    
    /**
     * @dev Soumettre un devoir (chiffré)
     */
    function submitAssignment(
        uint256 _assignmentId,
        string memory _encryptedAnswer,
        string memory _studentInfo,
        string memory _submissionHash
    ) public assignmentExists(_assignmentId) beforeDeadline(_assignmentId) returns (uint256) {
        require(
            assignments[_assignmentId].isActive,
            "Assignment is not active"
        );
        require(bytes(_encryptedAnswer).length > 0, "Answer cannot be empty");
        
        submissionCounter++;
        uint256 newSubmissionId = submissionCounter;
        
        submissions[newSubmissionId] = Submission({
            submissionId: newSubmissionId,
            assignmentId: _assignmentId,
            studentAddress: msg.sender,
            encryptedAnswer: _encryptedAnswer,
            studentInfo: _studentInfo,
            submissionHash: _submissionHash,
            submittedAt: block.timestamp,
            isGraded: false
        });
        
        studentSubmissions[msg.sender].push(newSubmissionId);
        assignmentSubmissions[_assignmentId].push(newSubmissionId);
        
        // Log audit
        _createAuditLog(
            msg.sender,
            "SUBMIT_ASSIGNMENT",
            string(abi.encodePacked("Submission ID: ", uintToString(newSubmissionId)))
        );
        
        emit SubmissionReceived(newSubmissionId, _assignmentId, msg.sender, block.timestamp);
        
        return newSubmissionId;
    }
    
    /**
     * @dev Publier le résultat d'une soumission
     */
    function publishResult(
        uint256 _submissionId,
        uint256 _grade,
        string memory _comment,
        string memory _resultHash
    ) public returns (uint256) {
        require(
            submissions[_submissionId].submittedAt > 0,
            "Submission does not exist"
        );
        
        uint256 assignmentId = submissions[_submissionId].assignmentId;
        require(
            assignments[assignmentId].teacherAddress == msg.sender,
            "Only the teacher can publish results"
        );
        require(_grade <= 100, "Grade must be between 0 and 100");
        
        resultCounter++;
        uint256 newResultId = resultCounter;
        
        results[newResultId] = Result({
            resultId: newResultId,
            submissionId: _submissionId,
            grade: _grade,
            comment: _comment,
            resultHash: _resultHash,
            publishedAt: block.timestamp
        });
        
        submissions[_submissionId].isGraded = true;
        
        // Log audit
        _createAuditLog(
            msg.sender,
            "PUBLISH_RESULT",
            string(abi.encodePacked("Result ID: ", uintToString(newResultId)))
        );
        
        emit ResultPublished(newResultId, _submissionId, _grade);
        
        return newResultId;
    }
    
    /**
     * @dev Récupérer un devoir par son ID
     */
    function getAssignment(uint256 _assignmentId) 
        public 
        view 
        assignmentExists(_assignmentId) 
        returns (Assignment memory) 
    {
        return assignments[_assignmentId];
    }
    
    /**
     * @dev Récupérer une soumission par son ID
     */
    function getSubmission(uint256 _submissionId) 
        public 
        view 
        returns (Submission memory) 
    {
        require(
            submissions[_submissionId].submittedAt > 0,
            "Submission does not exist"
        );
        return submissions[_submissionId];
    }
    
    /**
     * @dev Récupérer un résultat par son ID
     */
    function getResult(uint256 _resultId) 
        public 
        view 
        returns (Result memory) 
    {
        require(
            results[_resultId].publishedAt > 0,
            "Result does not exist"
        );
        return results[_resultId];
    }
    
    /**
     * @dev Récupérer tous les devoirs d'un enseignant
     */
    function getTeacherAssignments(address _teacher) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return teacherAssignments[_teacher];
    }
    
    /**
     * @dev Récupérer toutes les soumissions d'un étudiant
     */
    function getStudentSubmissions(address _student) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return studentSubmissions[_student];
    }
    
    /**
     * @dev Récupérer toutes les soumissions pour un devoir
     */
    function getAssignmentSubmissions(uint256 _assignmentId) 
        public 
        view 
        assignmentExists(_assignmentId) 
        returns (uint256[] memory) 
    {
        return assignmentSubmissions[_assignmentId];
    }
    
    /**
     * @dev Récupérer le résultat d'une soumission
     */
    function getResultBySubmission(uint256 _submissionId) 
        public 
        view 
        returns (Result memory) 
    {
        for (uint256 i = 1; i <= resultCounter; i++) {
            if (results[i].submissionId == _submissionId) {
                return results[i];
            }
        }
        revert("No result found for this submission");
    }
    
    /**
     * @dev Récupérer tous les logs d'audit
     */
    function getAuditLogs() public view returns (AuditLog[] memory) {
        AuditLog[] memory logs = new AuditLog[](auditLogCounter);
        for (uint256 i = 1; i <= auditLogCounter; i++) {
            logs[i - 1] = auditLogs[i];
        }
        return logs;
    }
    
    /**
     * @dev Créer un log d'audit (fonction interne)
     */
    function _createAuditLog(
        address _actor,
        string memory _action,
        string memory _details
    ) internal {
        auditLogCounter++;
        
        auditLogs[auditLogCounter] = AuditLog({
            logId: auditLogCounter,
            actor: _actor,
            action: _action,
            timestamp: block.timestamp,
            details: _details
        });
        
        emit AuditLogCreated(auditLogCounter, _actor, _action);
    }
    
    /**
     * @dev Utilitaire pour convertir uint en string
     */
    function uintToString(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}