import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from ldap3 import Server, Connection, ALL, SUBTREE, MODIFY_ADD, MODIFY_DELETE, MODIFY_REPLACE, Tls
import ssl
from flask_cors import CORS

# Initialize the Flask app and enable CORS for front-end access
app = Flask(__name__)
CORS(app)

# Load environment variables from a .env file
load_dotenv()

# LDAP configuration from environment variables
try:
    USER_DN = os.environ["USER_DN"]
    PASSWORD = os.environ["PASSWORD"]
    LDAP_SERVER = os.environ["SERVER_ADDRESS"]
    BASE_DN_USERS = os.environ["BASE_DN_USERS"]
    BASE_DN_GROUPS = os.environ["BASE_DN_GROUPS"]
    DEFAULT_GROUP_DN = os.environ["DEFAULT_GROUP_DN"]
    # Optional: UPN suffix for userPrincipalName (e.g., 'leapad.com')
    UPN_SUFFIX = os.environ.get("UPN_SUFFIX")
except KeyError as e:
    print(f"Error: Missing environment variable {e}")
    exit(1)

def get_ldap_connection():
    """
    Establishes and returns an LDAP connection.
    Raises an exception if the connection fails.
    
    NOTE: This is a simplified approach using a single service account. 
    For a production environment, it is highly recommended to implement 
    per-user authentication for security and proper access control.
    """
    # Try to establish a secure connection first (LDAPS or StartTLS), then fall back
    # to an insecure bind only if secure options fail. Active Directory requires a
    # secure channel to set unicodePwd; this helps avoid "failed to set password" errors.
    try:
        # If an explicit LDAPS port or flag is provided, attempt LDAPS
        use_ldaps = os.environ.get("LDAP_USE_SSL", "false").lower() in ("1", "true", "yes")
        ldaps_port = int(os.environ.get("LDAP_SSL_PORT", "636"))

        if use_ldaps:
            try:
                # Optionally ignore certificate validation for testing via LDAP_IGNORE_CERT env var
                ignore_cert = os.environ.get("LDAP_IGNORE_CERT", "false").lower() in ("1", "true", "yes")
                tls = None
                if ignore_cert:
                    tls = Tls(validate=ssl.CERT_NONE)
                else:
                    tls = Tls()  # default validation

                server = Server(LDAP_SERVER, port=ldaps_port, use_ssl=True, tls=tls, get_info=ALL, connect_timeout=5)
                conn = Connection(server, user=USER_DN, password=PASSWORD, auto_bind=True)
                return conn
            except Exception as e:
                print(f"LDAPS connection attempt failed: {e}")

        # Try StartTLS on standard LDAP port (389)
        try:
            server = Server(LDAP_SERVER, port=389, get_info=ALL, connect_timeout=5)
            conn = Connection(server, user=USER_DN, password=PASSWORD, auto_bind=False)
            # Open and start TLS if supported
            conn.open()
            try:
                if conn.start_tls():
                    if conn.bind():
                        return conn
                else:
                    print("StartTLS not supported or failed")
            except Exception as e:
                print(f"StartTLS bind failed: {e}")
            # if StartTLS path didn't return, unbind and continue to fallback
            try:
                conn.unbind()
            except Exception:
                pass
        except Exception as e:
            print(f"StartTLS attempt failed: {e}")

        # Fallback: simple bind on configured port (insecure). Use only as last resort.
        try:
            server = Server(LDAP_SERVER, port=389, get_info=ALL, connect_timeout=5)
            conn = Connection(server, user=USER_DN, password=PASSWORD, auto_bind=True)
            return conn
        except Exception as e:
            print(f"Insecure bind attempt failed: {e}")
            raise
    except Exception as e:
        print(f"LDAP connection failed: {e}")
        # Re-raise the exception to be caught by the API route's error handler
        raise Exception(f"Cannot connect to LDAP server: {str(e)}")

def fetch_groups(base_dn):
    """
    Fetches all groups from a given base DN.
    """
    conn = None
    try:
        conn = get_ldap_connection()
        conn.search(base_dn, '(objectClass=group)', search_scope=SUBTREE, attributes=['*'])
        groups = []
        for entry in conn.entries:
            group = {attr: entry[attr].value for attr in entry.entry_attributes_as_dict}
            groups.append(group)
            print(groups)
        return groups
    finally:
        if conn:
            conn.unbind()


def fetch_group_by_samaccountname(base_dn, samaccountname):
    """
    Fetches a single group by sAMAccountName from a given base DN.
    """
    conn = None
    try:
        conn = get_ldap_connection()
        search_filter = f'(&(objectClass=group)(sAMAccountName={samaccountname}))'
        conn.search(base_dn, search_filter, search_scope=SUBTREE, attributes=['*'])

        if not conn.entries:
            return None

        group = {attr: conn.entries[0][attr].value for attr in conn.entries[0].entry_attributes_as_dict}
        return group
    finally:
        if conn:
            conn.unbind()




@app.route('/groups', methods=['GET'])
def get_all_groups():
    """
    API endpoint to get all groups from the configured base DN.
    """
    try:
        groups = fetch_groups(BASE_DN_GROUPS)
        return jsonify(groups), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

def fetch_user_by_samaccountname(base_dn, samaccountname):
    """
    Fetches a single user by sAMAccountName from a given base DN.
    """
    conn = None
    try:
        conn = get_ldap_connection()
        search_filter = f'(&(objectClass=user)(sAMAccountName={samaccountname}))'
        conn.search(base_dn, search_filter, search_scope=SUBTREE, attributes=['*'])

        if not conn.entries:
            return None

        user = {attr: conn.entries[0][attr].value for attr in conn.entries[0].entry_attributes_as_dict}
        return user
    finally:
        if conn:
            conn.unbind()

def fetch_user_groups(user_dn):
    conn = None
    try:
        conn = get_ldap_connection()
        conn.search(user_dn, '(objectClass=user)', attributes=['memberOf'])
        if not conn.entries:
            return []
        return list(conn.entries[0]['memberOf'].values) if 'memberOf' in conn.entries[0] else []
    finally:
        if conn:
            conn.unbind()

@app.route('/groups/one', methods=['GET'])
def get_group():
    """
    API endpoint to get a single group and its members by the group's name.
    """
    conn = None
    try:
        samaccountname = request.args.get('name')
        
        if not samaccountname:
            return jsonify({"error": "name parameter is required"}), 400
        
        group = fetch_group_by_samaccountname(BASE_DN_GROUPS, samaccountname)
        
        if not group:
            return jsonify({"error": "Group not found"}), 404
        
        # Get the distinguished name of the group to search for members
        group_dn = group.get("distinguishedName")
        
        conn = get_ldap_connection()    
        # Search for users who are members of this group
        search_filter = f'(memberOf={group_dn})'
        conn.search(BASE_DN_USERS, search_filter, search_scope=SUBTREE, attributes=['*'])
        
        users = []
        for entry in conn.entries:
            user = {attr: entry[attr].value for attr in entry.entry_attributes_as_dict}
            users.append(user)
        
        return jsonify({"group": group, "members": users}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()


@app.route('/groups', methods=['POST'])
def add_group():
    """
    API endpoint to create a new group.
    """
    conn = None
    try:
        data = request.json
        required_fields = ['name', 'description']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = get_ldap_connection()
        group_dn = f"CN={data['name']},{BASE_DN_GROUPS}"
        attributes = {
            'objectClass': ['top', 'group'],
            'sAMAccountName': data['name'],
            'name': data['name'],
            'description': data['description']
        }
        
        conn.add(group_dn, attributes=attributes)
        
        if conn.result['description'] != 'success':
            return jsonify({"error": f"Failed to add group: {conn.result['description']}"}), 500
        
        return jsonify({"message": "Group added successfully"}), 201
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/groups', methods=['DELETE'])
def delete_group():
    """
    API endpoint to delete a group by its sAMAccountName.
    """
    conn = None
    try:
        samaccountname = request.args.get('name')
        if not samaccountname: 
            return jsonify({"error": "name argument (param) is required"}), 400
        
        group = fetch_group_by_samaccountname(BASE_DN_GROUPS, samaccountname)
        
        if not group:
            return jsonify({"error": "Group non existent"}), 404
        
        group_dn = group.get('distinguishedName')
        
        conn = get_ldap_connection()
        conn.delete(group_dn)
        
        if conn.result['description'] != 'success':
            return jsonify({"error": f"Failed to delete group: {conn.result['description']}"}), 500
        
        return jsonify({"message": "Group deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/groups', methods=['PUT'])
def update_group():
    """
    Update a group's name (CN/RDN) and/or description.
    Selector: query param 'name' (sAMAccountName)
    Body: { new_name?, description? }
    """
    conn = None
    try:
        current_name = request.args.get('name')
        if not current_name:
            return jsonify({"error": "name query parameter is required"}), 400
        data = request.json or {}
        new_name = data.get('new_name')
        description = data.get('description')

        group = fetch_group_by_samaccountname(BASE_DN_GROUPS, current_name)
        if not group:
            return jsonify({"error": "Group not found"}), 404

        group_dn = group.get('distinguishedName')
        if not group_dn:
            return jsonify({"error": "Group DN not found"}), 400

        conn = get_ldap_connection()
        # Update description and sAMAccountName/name if provided
        modifications = {}
        if description is not None:
            modifications['description'] = [(MODIFY_REPLACE, [description])]
        if new_name is not None and new_name != current_name:
            modifications['sAMAccountName'] = [(MODIFY_REPLACE, [new_name])]
            modifications['name'] = [(MODIFY_REPLACE, [new_name])]

        if modifications:
            conn.modify(group_dn, modifications)
            if conn.result['description'] != 'success':
                return jsonify({"error": f"Failed to update attributes: {conn.result['description']}"}), 500

        # If new_name provided, rename RDN (CN)
        if new_name is not None and new_name != current_name:
            try:
                conn.modify_dn(group_dn, f"CN={new_name}", delete_old_dn=True)
                if conn.result['description'] != 'success':
                    return jsonify({"error": f"Failed to rename group: {conn.result['description']}"}), 500
                # success: compute new DN for response
                group_dn = f"CN={new_name},{BASE_DN_GROUPS}"
            except Exception as e:
                return jsonify({"error": f"Rename failed: {str(e)}"}), 500

        return jsonify({"message": "Group updated successfully", "distinguishedName": group_dn}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/groups/members', methods=['POST'])
def add_user_to_group():
    """
    API endpoint to add a user to a group.
    """
    conn = None
    try:
        data = request.json
        user_dn = data.get('user_dn')
        group_dn = data.get('group_dn')
        if not user_dn or not group_dn:
            return jsonify({"error": "user_dn and group_dn are required"}), 400

        conn = get_ldap_connection()
        
        # Add the user to the group by modifying the group's 'member' attribute
        conn.modify(group_dn, {'member': [(MODIFY_ADD, [user_dn])]})
        
        if conn.result['description'] != 'success':
            return jsonify({"error": conn.result['description']}), 500
        
        return jsonify({"message": "User added to group successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/groups/members', methods=['DELETE'])
def remove_user_from_group():
    """
    API endpoint to remove a user from a group.
    """
    conn = None
    try:
        user_dn = request.args.get('user_dn')
        group_dn = request.args.get('group_dn')
        
        if not user_dn or not group_dn:
            return jsonify({"error": "user_dn and group_dn parameters are required"}), 400
        
        print(f"Removing user {user_dn} from group {group_dn}")  # Debug log
        
        conn = get_ldap_connection()
        if not conn:
            return jsonify({"error": "Failed to establish LDAP connection"}), 500

        # Direct modification attempt without pre-validation
        modifications = {'member': [(MODIFY_DELETE, [user_dn])]}
        
        try:
            conn.modify(group_dn, modifications)
            result = conn.result
            
            # Log the LDAP result for debugging
            print(f"LDAP modify result: {result}")
            
            if result['description'] == 'success':
                return jsonify({"message": "User removed from group successfully"}), 200
            else:
                return jsonify({
                    "error": "Failed to remove user from group",
                    "ldap_error": result.get('description', 'Unknown error'),
                    "message": result.get('message', '')
                }), 500
                
        except Exception as modify_error:
            print(f"LDAP modify error: {str(modify_error)}")  # Debug log
            return jsonify({
                "error": "LDAP modification failed",
                "details": str(modify_error)
            }), 500
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500
        
    finally:
        if conn:
            try:
                conn.unbind()
            except Exception as unbind_error:
                print(f"Unbind error (ignored): {str(unbind_error)}")  # Debug log

# USER APIS
@app.route('/test-connection', methods=['GET'])
def test_connection():
    """
    API endpoint to test the LDAP connection.
    """
    try:
        conn = get_ldap_connection()
        conn.unbind()
        return jsonify({"message": "LDAP connection successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/users', methods=['GET'])
def list_users():
    """
    API endpoint to list all users.
    """
    conn = None
    try:
        conn = get_ldap_connection()
        search_filter = '(objectClass=user)'
        conn.search(BASE_DN_USERS, search_filter, search_scope=SUBTREE, attributes=['*'])
        
        if not conn.entries:
            return jsonify({"error": "No users found"}), 404
        
        users = []
        for entry in conn.entries:
            user = {attr: entry[attr].value for attr in entry.entry_attributes_as_dict}
            users.append(user)
            print(users)
        
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": f"LDAP connection failed: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/users/membership', methods=['GET'])
def list_user_groups():
    """
    API endpoint to list all groups a user is a member of.
    """
    conn = None
    try:
        user_dn = request.args.get('user_dn')
        if not user_dn:
            return jsonify({"error": "user_dn param is required"}), 400
        
        conn = get_ldap_connection()
        
        # The memberOf attribute is a list of group DNs the user belongs to.
        # This is a standard operational attribute on user objects in Active Directory.
        conn.search(user_dn, '(objectClass=user)', attributes=['memberOf'])
        
        if not conn.entries or 'memberOf' not in conn.entries[0]:
            return jsonify({"error": "No groups found for user or user does not exist"}), 404
        
        groups_dns = conn.entries[0]['memberOf'].values
        conn.unbind()

        # You might want to fetch more details about each group if needed.
        # For this example, we'll just return the DNs.
        return jsonify(groups_dns), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/users', methods=['POST'])
def create_user():
    """
    API endpoint to create a new user and add them to the default group.
    Now requires a password field and enforces password complexity.
    """
    conn = None
    try:
        data = request.json
        required_fields = ['first_name', 'last_name', 'email', 'sAMAccountName']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        first_name = data['first_name']
        last_name = data['last_name']
        email = data['email']
        sAMAccountName = data['sAMAccountName']
        requested_groups = data.get('memberOf', []) or []  # list of group sAMAccountName or name strings
        full_name = f"{first_name} {last_name}"
        user_dn = f"CN={full_name},{BASE_DN_USERS}"
        
        # Derive userPrincipalName: prefer configured UPN suffix; fall back to email
        if UPN_SUFFIX:
            user_principal_name = f"{sAMAccountName}@{UPN_SUFFIX}"
        else:
            user_principal_name = email

        attributes = {
            'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
            'cn': full_name,
            'sn': last_name,
            'givenName': first_name,
            'displayName': full_name,
            'userPrincipalName': user_principal_name,
            'mail': email,
            'sAMAccountName': sAMAccountName,
            # Create as disabled account without password; can be enabled after setting password
            'userAccountControl': 546,
        }

        conn = get_ldap_connection()
        
        # Step 1: Add the user
        conn.add(user_dn, attributes=attributes)
        if conn.result['description'] != 'success':
            return jsonify({'error': f"Failed to add user: {conn.result['description']}"}), 400


        # Step 2: Compute target groups to add membership to (default + requested)
        target_group_dns = set()
        if DEFAULT_GROUP_DN:
            target_group_dns.add(DEFAULT_GROUP_DN)

        # Resolve each requested group to its DN
        for grp_name in requested_groups:
            try:
                group = fetch_group_by_samaccountname(BASE_DN_GROUPS, grp_name)
                if group and group.get('distinguishedName'):
                    target_group_dns.add(group['distinguishedName'])
            except Exception:
                # Ignore resolution errors for individual groups; continue with others
                continue

        # Step 3: Add user to each target group
        added_groups = []
        failed_groups = []
        for grp_dn in target_group_dns:
            conn.modify(grp_dn, {'member': [(MODIFY_ADD, [user_dn])]} )
            if conn.result['description'] == 'success':
                added_groups.append(grp_dn)
            else:
                failed_groups.append({ 'group_dn': grp_dn, 'error': conn.result['description'] })

        if failed_groups and not added_groups:
            return jsonify({'error': 'User created, but failed to add to any groups', 'details': failed_groups}), 500

        return jsonify({'message': 'User created successfully', 'added_groups': added_groups, 'failed_groups': failed_groups}), 201
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/users', methods=['DELETE'])
def delete_user():
    """
    API endpoint to delete a user by sAMAccountName.
    """
    conn = None
    try:
        sAM = request.args.get('sam')
        if not sAM:
            return jsonify({"error": "sam query parameter is required"}), 400

        user = fetch_user_by_samaccountname(BASE_DN_USERS, sAM)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_dn = user.get('distinguishedName')
        if not user_dn:
            return jsonify({"error": "User DN not found"}), 400

        conn = get_ldap_connection()
        conn.delete(user_dn)

        if conn.result['description'] != 'success':
            return jsonify({"error": f"Failed to delete user: {conn.result['description']}"}), 500

        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

@app.route('/users/one', methods=['GET'])
def get_user():
    """
    API endpoint to get a single user by sAMAccountName including group DNs.
    """
    try:
        sAM = request.args.get('sam')
        if not sAM:
            return jsonify({"error": "sam query parameter is required"}), 400
        user = fetch_user_by_samaccountname(BASE_DN_USERS, sAM)
        if not user:
            return jsonify({"error": "User not found"}), 404
        member_dns = []
        if 'distinguishedName' in user:
            member_dns = fetch_user_groups(user['distinguishedName'])
        return jsonify({"user": user, "memberOf": member_dns}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500



@app.route('/users', methods=['PUT'])
def update_user():
    """
    Update user basic attributes and group memberships by sAMAccountName selector.
    Accepts JSON: { first_name, last_name, email, memberOf: [group names], new_password?: string }
    """
    conn = None
    try:
        sAM = request.args.get('sam')
        if not sAM:
            return jsonify({"error": "sam query parameter is required"}), 400
        data = request.json or {}
        user = fetch_user_by_samaccountname(BASE_DN_USERS, sAM)
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_dn = user.get('distinguishedName')
        if not user_dn:
            return jsonify({"error": "User DN not found"}), 400

        # Prepare attribute modifications
        modifications = {}
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        if first_name is not None:
            modifications['givenName'] = [(MODIFY_REPLACE, [first_name])]
        if last_name is not None:
            modifications['sn'] = [(MODIFY_REPLACE, [last_name])]
        # update displayName (but do NOT touch cn here; cn is the RDN)
        if first_name is not None or last_name is not None:
            display = f"{first_name or user.get('givenName', '')} {last_name or user.get('sn', '')}".strip()
            modifications['displayName'] = [(MODIFY_REPLACE, [display])]
        if email is not None:
            modifications['mail'] = [(MODIFY_REPLACE, [email])]
            # Update UPN to match policy
            if 'sAMAccountName' in user:
                upn = f"{user['sAMAccountName']}@{UPN_SUFFIX}" if 'UPN_SUFFIX' in globals() and UPN_SUFFIX else email
                modifications['userPrincipalName'] = [(MODIFY_REPLACE, [upn])]

        conn = get_ldap_connection()
        if modifications:
            conn.modify(user_dn, modifications)
            if conn.result['description'] != 'success':
                return jsonify({"error": f"Failed to update attributes: {conn.result['description']}"}), 500

        # If name changed, attempt to rename CN (modify DN). Safe to skip on failure.
        if (first_name is not None) or (last_name is not None):
            new_cn = f"{first_name or user.get('givenName', '')} {last_name or user.get('sn', '')}".strip()
            current_cn = user.get('cn')
            if new_cn and current_cn and new_cn != current_cn:
                try:
                    conn.modify_dn(user_dn, f"CN={new_cn}", delete_old_dn=True)
                    if conn.result['description'] == 'success':
                        user_dn = f"CN={new_cn},{BASE_DN_USERS}"
                except Exception:
                    pass

        # Handle groups
        requested_groups = data.get('memberOf')
        added_groups = []
        removed_groups = []
        if isinstance(requested_groups, list):
            current_group_dns = set(fetch_user_groups(user_dn))
            target_dns = set()
            # Always include default group
            if DEFAULT_GROUP_DN:
                target_dns.add(DEFAULT_GROUP_DN)
            for grp_name in requested_groups:
                group = fetch_group_by_samaccountname(BASE_DN_GROUPS, grp_name)
                if group and group.get('distinguishedName'):
                    target_dns.add(group['distinguishedName'])
            to_add = target_dns - current_group_dns
            to_remove = current_group_dns - target_dns
            for dn in to_add:
                conn.modify(dn, {'member': [(MODIFY_ADD, [user_dn])]} )
                if conn.result['description'] == 'success':
                    added_groups.append(dn)
            for dn in to_remove:
                conn.modify(dn, {'member': [(MODIFY_DELETE, [user_dn])]} )
                if conn.result['description'] == 'success':
                    removed_groups.append(dn)

        return jsonify({"message": "User updated successfully", "added_groups": added_groups, "removed_groups": removed_groups}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.unbind()

if __name__ == '__main__':
    app.run(debug=True)
