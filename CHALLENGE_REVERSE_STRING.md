# Challenge: Reverse String

## 📋 Información del Challenge

**Título:** Reverse String  
**Descripción:** Write a function that takes a string as input and returns the string reversed.

**Ejemplos:**
- Input: `"hello"` → Output: `"olleh"`
- Input: `"world"` → Output: `"dlrow"`

**Restricciones:**
- The input string will only contain lowercase letters and spaces
- The string length will be between 1 and 1000 characters

## ⚙️ Configuración

- **Difficulty:** Easy
- **Tags:** string, algorithms, basic
- **Time Limit:** 1000 ms
- **Memory Limit:** 256 MB

## 🧪 Test Cases

### Test Case 1 (Visible)
- **Input:** `{"str": "hello"}`
- **Expected Output:** `"olleh"`
- **Is Hidden:** false
- **Order:** 1

### Test Case 2 (Visible)
- **Input:** `{"str": "world"}`
- **Expected Output:** `"dlrow"`
- **Is Hidden:** false
- **Order:** 2

### Test Case 3 (Visible)
- **Input:** `{"str": "a"}`
- **Expected Output:** `"a"`
- **Is Hidden:** false
- **Order:** 3

### Test Case 4 (Visible)
- **Input:** `{"str": "algorithm"}`
- **Expected Output:** `"mhtirogla"`
- **Is Hidden:** false
- **Order:** 4

### Test Case 5 (Hidden)
- **Input:** `{"str": "racecar"}`
- **Expected Output:** `"racecar"`
- **Is Hidden:** true
- **Order:** 5

## 💻 Soluciones de Ejemplo

### Python
```python
import json
import sys

data = json.loads(sys.stdin.read().strip())
s = data.get("str", "")

# Reverse the string
result = s[::-1]

print(json.dumps(result))
```

### JavaScript
```javascript
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const data = JSON.parse(input);
  const s = data.str || "";
  const result = s.split("").reverse().join("");
  console.log(JSON.stringify(result));
  rl.close();
});
```

### C++
```cpp
#include <iostream>
#include <string>
#include <algorithm>
#include <sstream>

using namespace std;

int main() {
    string input;
    getline(cin, input);
    
    // Simple JSON parsing for {"str": "value"}
    size_t strPos = input.find("\"str\"");
    size_t colonPos = input.find(":", strPos);
    size_t quoteStart = input.find("\"", colonPos) + 1;
    size_t quoteEnd = input.find("\"", quoteStart);
    string s = input.substr(quoteStart, quoteEnd - quoteStart);
    
    reverse(s.begin(), s.end());
    
    cout << "\"" << s << "\"" << endl;
    return 0;
}
```

### Java
```java
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();
        
        Gson gson = new Gson();
        JsonObject json = gson.fromJson(input, JsonObject.class);
        String s = json.get("str").getAsString();
        
        StringBuilder sb = new StringBuilder(s);
        String result = sb.reverse().toString();
        
        System.out.println(gson.toJson(result));
    }
}
```

## 📝 Instrucciones para Crear el Challenge

1. Ve a `/admin` como administrador
2. Haz clic en "Challenges" o "Manage Challenges"
3. Haz clic en "Create Challenge"
4. Completa el formulario con:
   - **Title:** Reverse String
   - **Description:** Write a function that takes a string as input and returns the string reversed.
   
   Example 1:
   Input: "hello"
   Output: "olleh"
   
   Example 2:
   Input: "world"
   Output: "dlrow"
   
   Constraints:
   - The input string will only contain lowercase letters and spaces
   - The string length will be between 1 and 1000 characters
   
   - **Difficulty:** Easy
   - **Tags:** string, algorithms, basic
   - **Time Limit:** 1000
   - **Memory Limit:** 256
   - **Course:** Selecciona un curso existente
   - **Status:** Published (o Draft si quieres revisarlo primero)

5. Agrega los 5 test cases:
   - Test Case 1: Input: `{"str": "hello"}`, Output: `"olleh"`, Hidden: No
   - Test Case 2: Input: `{"str": "world"}`, Output: `"dlrow"`, Hidden: No
   - Test Case 3: Input: `{"str": "a"}`, Output: `"a"`, Hidden: No
   - Test Case 4: Input: `{"str": "algorithm"}`, Output: `"mhtirogla"`, Hidden: No
   - Test Case 5: Input: `{"str": "racecar"}`, Output: `"racecar"`, Hidden: Yes

6. Haz clic en "Create Challenge"

## ✅ Cómo Probar

1. Inicia sesión como estudiante
2. Ve a `/challenges`
3. Busca "Reverse String"
4. Selecciona el lenguaje (Python, JavaScript, C++, Java)
5. Pega la solución correspondiente
6. Haz clic en "Submit"
7. Debería pasar todos los test cases ✅

