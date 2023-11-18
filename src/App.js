import React, { useState } from 'react';
import './App.css';
class Bencoder {
  static encode(obj) {
    return Bencoder._encode(obj);
  }

  static decode(encodedStr) {
    try {
      const [decodedObj, remaining] = Bencoder._decode(encodedStr);
      if (remaining === '') {
        return decodedObj;
      } else {
        throw new Error('Invalid Bencoding: Extra characters after decoding');
      }
    } catch (error) {
      throw new Error(`Error decoding Bencoding: ${error.message}`);
    }
  }

  static _encode(obj) {
    if (typeof obj === 'number') {
      return Bencoder.encodeInteger(obj);
    } else if (typeof obj === 'string') {
      return Bencoder.encodeString(obj);
    } else if (Array.isArray(obj)) {
      return Bencoder.encodeList(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      return Bencoder.encodeDictionary(obj);
    } else {
      throw new Error(`Unsupported type: ${typeof obj}`);
    }
  }

  static _decode(encodedStr) {
    if (!encodedStr) {
      throw new Error('Empty input for decoding');
    }

    const firstChar = encodedStr[0];

    if (firstChar === 'i') {
      return Bencoder.decodeInteger(encodedStr);
    } else if (firstChar === 'l') {
      return Bencoder.decodeList(encodedStr);
    } else if (firstChar === 'd') {
      return Bencoder.decodeDictionary(encodedStr);
    } else if (/^\d/.test(firstChar)) {
      return Bencoder.decodeString(encodedStr);
    } else {
      throw new Error('Invalid Bencoding');
    }
  }

  static encodeInteger(number) {
    if (!Number.isInteger(number)) {
      throw new Error('Invalid Bencoding: Integer expected');
    }
    return `i${number}e`;
  }

  static encodeString(str) {
    if (typeof str !== 'string') {
      throw new Error('Invalid Bencoding: String expected');
    }
    return `${str.length}:${str}`;
  }

  static encodeList(arr) {
    if (!Array.isArray(arr)) {
      throw new Error('Invalid Bencoding: Array expected');
    }
    return `l${arr.map(item => Bencoder._encode(item)).join('')}e`;
  }

  static encodeDictionary(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('Invalid Bencoding: Object expected');
    }

    const keys = Object.keys(obj).sort();
    return `d${keys.map(key => `${key.length}:${key}${Bencoder._encode(obj[key])}`).join('')}e`;
  }

  static decodeInteger(encodedStr) {
    const endIdx = encodedStr.indexOf('e');
    if (endIdx === 1) {
      throw new Error('Invalid Bencoding: Empty integer');
    }

    const number = parseInt(encodedStr.slice(1, endIdx), 10);
    if (isNaN(number)) {
      throw new Error('Invalid Bencoding: Malformed integer');
    }

    return [number, encodedStr.slice(endIdx + 1)];
  }

  static decodeList(encodedStr) {
    const decodedList = [];
    let rest = encodedStr.slice(1);

    while (rest && rest[0] !== 'e') {
      const [item, newRest] = Bencoder._decode(rest);
      decodedList.push(item);
      rest = newRest;
    }

    if (!rest) {
      throw new Error('Invalid Bencoding: Incomplete list');
    }

    return [decodedList, rest.slice(1)];
  }

  static decodeDictionary(encodedStr) {
    const decodedDict = {};
    let rest = encodedStr.slice(1);

    while (rest && rest[0] !== 'e') {
      const [key, newRest1] = Bencoder._decode(rest);
      const [value, newRest2] = Bencoder._decode(newRest1);
      decodedDict[key] = value;
      rest = newRest2;
    }

    if (!rest) {
      throw new Error('Invalid Bencoding: Incomplete dictionary');
    }

    return [decodedDict, rest.slice(1)];
  }

  static decodeString(encodedStr) {
    const colonIdx = encodedStr.indexOf(':');
    if (colonIdx === -1) {
      throw new Error('Invalid Bencoding: Missing colon in string');
    }

    const length = parseInt(encodedStr.slice(0, colonIdx), 10);
    if (isNaN(length)) {
      throw new Error('Invalid Bencoding: Malformed string length');
    }

    if (colonIdx + 1 + length > encodedStr.length) {
      throw new Error('Invalid Bencoding: Incomplete string');
    }

    const data = encodedStr.slice(colonIdx + 1, colonIdx + 1 + length);
    return [data, encodedStr.slice(colonIdx + 1 + length)];
  }
}

function App() {
  const [inputData, setInputData] = useState('');
  const [outputResult, setOutputResult] = useState('');
  const [isEncoding, setIsEncoding] = useState(true);

  const toggleEncoderDecoder = () => {
    setIsEncoding((prevIsEncoding) => !prevIsEncoding);
    setOutputResult('');
    setInputData('');
  };

  const handleEncodeDecode = () => {
    try {
      if (isEncoding) {
        const data = JSON.parse(inputData);
        const encodedData = Bencoder.encode(data);
        setOutputResult(encodedData);
      } else {
        const decodedResult = Bencoder.decode(inputData);
        setOutputResult(JSON.stringify(decodedResult, null, 2));
      }
    } catch (error) {
      setOutputResult(`Error: ${error.message}`);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Bencoder React App</h1>
      </header>
      <div className="app-content">
        <label htmlFor="inputData" className="input-label">
          {isEncoding ? 'Enter Data:' : 'Enter Bencoded Data to Decode:'}
        </label>
        <textarea
          id="inputData"
          className="input-textarea"
          placeholder={isEncoding ? '{"bar": "spam", "foo": 42}' : 'd3:foo3:bare'}
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
        ></textarea>
        <button onClick={handleEncodeDecode} className="encode-button">
          {isEncoding ? 'Encode' : 'Decode'}
        </button>
        <label htmlFor="outputResult" className="output-label">
          {isEncoding ? 'Bencoded Result:' : 'Decoded Result:'}
        </label>
        <pre id="outputResult" className="output-pre">
          {outputResult}
        </pre>
        <button onClick={toggleEncoderDecoder} className="toggle-button">
          Switch Encoder/Decoder
        </button>
      </div>
    </div>
  );
}

export default App;
