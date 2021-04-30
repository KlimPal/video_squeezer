import { PBKDF2 } from 'crypto-js';
import * as CryptoJS from 'crypto-js'
import { nodeRootAddress } from '../globalConfig'
import * as flatten from 'flat'
declare let alertify: any;
import { diff } from 'deep-object-diff'
import * as _ from 'lodash'
import SparkMD5 from 'spark-md5'

let nodeUrl = nodeRootAddress;

export let dateUtils = {
    msToStringDelay: (ms, { showSeconds = true } = {}) => {
        let isNegative = ms < 0
        if (isNegative) {
            ms = -ms;
        }
        let msInD = 1000 * 60 * 60 * 24
        let msInH = 1000 * 60 * 60
        let msInM = 1000 * 60
        let msInS = 1000

        let d = Math.floor(ms / msInD)
        ms = ms % msInD
        let h = Math.floor(ms / msInH)
        ms = ms % msInH
        let m = Math.floor(ms / msInM);
        ms = ms % msInM;
        let s = Math.floor(ms / msInS);
        ms = ms % msInS;
        return (isNegative ? '- ' : '') + ((d) ? d + 'd ' : '') + ((h) ? h + 'h ' : '') + ((m) ? m + 'm ' : '') + ((s && showSeconds || (!d && !h && !m)) ? s + 's' : '');
    }
}
let counterForUniqueCode = 0;
let lastDateForUniqueCode = 0;

function generateRandomCode(length, charPreset = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM') {
    let charList = [];
    for (let i = 0; i < length; i++) {
        charList[i] = charPreset[Math.round(Math.random() * (charPreset.length - 1))];
    }
    return charList.join('');
}

function generateUniqueCode(minLength = 0, splitChar = '_') {
    let dateNow = Date.now()
    let result = dateNow.toString(36);
    if (lastDateForUniqueCode == dateNow) {
        counterForUniqueCode++;
        result += splitChar + counterForUniqueCode.toString(36)
    } else {
        counterForUniqueCode = 0;
    }
    lastDateForUniqueCode = dateNow;
    let lengthOfRandomSuffix = minLength - result.length;
    if (lengthOfRandomSuffix > 0) {
        result += splitChar + generateRandomCode(lengthOfRandomSuffix - 1);
    }
    return result;
}

export let http = {
    postJson: async (url, obj) => {
        let response = await fetch(nodeUrl + url, {
            body: JSON.stringify(obj),
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Token': localStorage.getItem('token') || '',
            }
        });
        let result = await response.json();
        return result;
    },
    postFormData: async (url, formData) => {
        let response = await fetch(nodeUrl + url, {
            body: formData,
            method: 'post',
            headers: {
                'Token': localStorage.getItem('token') || '',
            }
        });
        let result = await response.json();
        return result;
    },
    getBlob: async (url) => {
        let response = await fetch(nodeUrl + url, {
            headers: {
                'Token': localStorage.getItem('token') || '',
            }
        });
        let result = await response.blob();
        return result;
    },
    getJson: async (url, params) => {
        let query = '?' + Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');
        let response = await fetch(nodeUrl + url + query, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Token': localStorage.getItem('token') || '',
            }
        });
        let result = await response.json();
        return result;
    },

    putFileUsingPresignedUrl: async (presignedUrl, file) => {
        let response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file
        })
        let result = await response.text()
        return result
    }
}

export let msgUtils = {
    confirm: (text, { cancelBtn = "No", okBtn = "Yes" } = {}) => {
        return new Promise((resolve, reject) => {
            alertify.cancelBtn(cancelBtn).okBtn(okBtn).confirm(text, () => {
                resolve(true)
            }, () => {
                resolve(false)
            })
        })

    },
    alert: (text, { okBtn = "Ok", details = '' } = {}) => {
        if (details) {
            if (typeof (details) == 'object') {
                details = JSON.stringify(details, null, '  ')
            }
            text += `<details><summary>Details</summary>${details}</details>`
        }
        return new Promise((resolve, reject) => {
            alertify.okBtn(okBtn).alert(text, () => {
                resolve(true)
            }, () => {
                resolve(true)
            })
        })

    },
    prompt: (text, { okBtn = "Ok", cancelBtn = "Cancel", inputType = 'text' } = {}) => {
        return new Promise((resolve, reject) => {
            alertify.okBtn(okBtn).cancelBtn(cancelBtn).prompt(text, (inputText) => {
                resolve(inputText)
            }, () => {
                resolve(null)
            }, inputType)
        })

    },
    log: (text) => {
        alertify.log(text)
    },
    success: (text) => {
        alertify.success(text)
    },
    error: (text) => {
        alertify.error(text)
    }
}

export let cryptoUtils = {
    hashSum: (data, { keySize = 512 / 32, iterations = 1, salt = '' }) => {
        return PBKDF2(data, salt, {
            keySize: keySize,
            iterations: iterations
        }).toString();
    },
    baseEncrypt: (data, key) => {
        let b64 = CryptoJS.AES.encrypt(data, key).toString();
        let e64 = CryptoJS.enc.Base64.parse(b64);
        let eHex = e64.toString(CryptoJS.enc.Hex);
        return eHex;
    },

    baseDecrypt: (cipherText, key) => {
        let reb64 = CryptoJS.enc.Hex.parse(cipherText);
        let bytes = reb64.toString(CryptoJS.enc.Base64);
        let decrypt = CryptoJS.AES.decrypt(bytes, key);
        let plain = decrypt.toString(CryptoJS.enc.Utf8);
        return plain;
    },

    generateRandomCode: (length, charPreset = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM') => {
        let charList = [];
        for (let i = 0; i < length; i++) {
            charList[i] = charPreset[Math.round(Math.random() * (charPreset.length - 1))];
        }
        return charList.join('');
    },

    generateHexKey: (byteLength) => {
        function bufferToHex(buffer) {
            return Array
                .from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        }
        return bufferToHex(window.crypto.getRandomValues(new Uint8Array(byteLength)))
    },
    mMd5HashOfFile(file, {
        chunkSize = 1024 * 1024 * 5,
        progressCallback = (progress) => { },
        chunkNumberIncrement = 1
    }) {

        let chunks = Math.ceil(file.size / chunkSize)
        let currentChunk = 0
        let spark = new SparkMD5.ArrayBuffer()
        let fileReader = new FileReader();

        return new Promise((resolve, reject) => {
            fileReader.onload = function (e) {
                progressCallback((currentChunk + 1) / chunks)
                spark.append(e.target.result);
                currentChunk += chunkNumberIncrement;
                if (currentChunk < chunks) {
                    loadNext();
                } else {
                    let hash = spark.end()
                    resolve(hash)
                }
            };
            fileReader.onerror = function (err) {
                reject(err)
            };

            function loadNext() {
                let start = currentChunk * chunkSize
                let end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
                fileReader.readAsArrayBuffer(file.slice(start, end));
            }
            loadNext();
        })

    }

}

export let fsApi = {
    getRoot: ({ requestedBytes = 1024 * 1024 * 1024 * 10 } = {}) => {
        return new Promise((resolve, reject) => {
            const PERSISTENT = 1
            navigator['webkitPersistentStorage'].requestQuota(
                requestedBytes,
                function (grantedBytes) {
                    window['webkitRequestFileSystem'](PERSISTENT, grantedBytes, (fs) => {
                        resolve(fs.root)
                    }, (err) => { reject(err) });
                }, (err) => { reject(err) }
            );

        })
    },
    readDir: async (fsDir) => {
        const dirReader = fsDir.createReader();
        const result = [];

        function getEntries(dirReader): Promise<any[]> {
            return new Promise((resolve, reject) => {
                dirReader.readEntries((results) => {
                    resolve(results)
                }, (err) => {
                    reject(err)
                });
            })
        }

        while (true) {
            const newEntries = await getEntries(dirReader)
            if (newEntries.length) {
                result.push(...newEntries)
            } else {
                break
            }
        }
        return result;
    },
    getDir: (parentFsDir, dirName) => {
        return new Promise((resolve, reject) => {
            parentFsDir.getDirectory(dirName, { create: true }, (fsDir) => {
                resolve(fsDir)
            }, (err) => {
                reject(err)
            })
        })
    },
    getFileEntry: function (fsDir, fileName): Promise<any> {
        return new Promise((resolve, reject) => {
            fsDir.getFile(fileName, {}, (fileEntry) => {
                resolve(fileEntry)
            }, (err) => {
                reject(err)
            })
        })
    },
    getFile: function (fileEntry): Promise<File> {
        return new Promise((resolve, reject) => {
            fileEntry.file(async (file) => {
                resolve(file)
            }, (err) => {
                reject(err)
            })
        })
    },
    rmFile: (fileEntry) => {
        return new Promise((resolve, reject) => {
            fileEntry.remove(() => {
                resolve(null)
            }, (err) => {
                reject(err)
            });
        })
    },
    readFileAsText: async (fileEntry) => {
        const file = await fsApi.getFile(fileEntry)
        const text = await file['text']()
        return text
    },
    rmDir: (dirEntry) => {
        return new Promise((resolve, reject) => {
            dirEntry.removeRecursively(() => {
                resolve(null)
            }, (err) => {
                reject(err)
            })
        })
    },
    readFileAsBuffer: async (fileEntry) => {
        const file = await fsApi.getFile(fileEntry)
        const arrayBuffer = await file['arrayBuffer']()
        return arrayBuffer
    },
    saveFile: (fsDir, fileName, data) => {
        return new Promise((resolve, reject) => {
            fsDir.getFile(fileName, { create: true }, (file) => {
                file.createWriter((fileWriter) => {
                    let blob = new Blob([data])
                    fileWriter.write(blob)
                    fileWriter.onwriteend = (event) => {
                        resolve(event)
                    };
                    fileWriter.onerror = (err) => {
                        reject(err)
                    };
                }, (err) => {
                    reject(err)
                })
            }, (err) => {
                reject(err)
            })
        })
    }
}



export let inputUtils = {
    handlePhoneInput: (event, obj, property) => {
        let result = cf.formatPhoneNumber(event.target.value)
        event.target.value = result;
        obj[property] = result;
    },
    handleSsnInput: (event, obj, property) => {
        let digits = event.target.value.split('').filter(el => /\d/.test(el));
        let result = digits.slice(0, 3).join('');
        if (digits.length > 3) {
            result += '-' + digits.slice(3, 5).join('');
        }
        if (digits.length > 5) {
            result += '-' + digits.slice(5, 9).join('');
        }
        if (event.target.value[0] == 'X') {
            result = '';
        }
        event.target.value = result;
        obj[property] = result;
    }
}

export let cf = {
    generateUniqueCode: generateUniqueCode,
    sleep: (timeout) => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(null)
            }, timeout)
        })
    },
    formatPhoneNumber: (str = '') => {
        let digits = str.split('').filter(el => /\d/.test(el))
        let result = '+' + digits.slice(0, 14).join('');
        if (digits[0] == '1') {
            result = '+' + digits.slice(0, 1).join('')
            if (digits.length > 1) {
                result += '(' + digits.slice(1, 4).join('');
            }

            if (digits.length > 4) {
                result += ')' + digits.slice(4, 7).join('');
            }
            if (digits.length > 7) {
                result += '-' + digits.slice(7, 11).join('');
            }
        }

        if (digits.join('').indexOf('380') == 0) {
            result = '+' + digits.slice(0, 3).join('')
            if (digits.length > 3) {
                result += '(' + digits.slice(3, 5).join('');
            }

            if (digits.length > 5) {
                result += ')' + digits.slice(5, 8).join('');
            }
            if (digits.length > 8) {
                result += '-' + digits.slice(8, 12).join('');
            }
        }
        return result

    },
    getFriendlyFileSize: (sizeInBytes = 0) => {
        let postfixText = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (sizeInBytes >= 1024) {
            sizeInBytes = sizeInBytes / 1024;
            i++;
        }
        return sizeInBytes.toFixed(i) + ' ' + postfixText[i];
    },

    getFriendlyDistance: (distanceInMeters) => {
        if (distanceInMeters < 0.01) {
            return distanceInMeters * 1000 + 'mm'
        }
        if (distanceInMeters < 1) {
            return distanceInMeters * 100 + 'сm'
        }
        if (distanceInMeters < 1000) {
            return distanceInMeters + 'm'
        }
        return distanceInMeters / 1000 + 'km'
    },

    flattenObject: (obj, params = {}) => {
        params = { delimiter: '_', safe: true, ...params }
        return flatten(obj, params)
    },

    unflattenObject: (obj, params = {}) => {
        params = { delimiter: '_', safe: true, ...params }
        return flatten.unflatten(obj, params)
    },
    diff: diff,

    deepMap: (data, callback, callbackForObjects = null) => {
        let result = _.cloneDeep(data)

        function func(obj) {
            for (let prop in obj) {
                let value = obj[prop]
                let type = typeof value
                if (obj.hasOwnProperty(prop)) {
                    if (type == "object") {
                        if (callbackForObjects) {
                            obj[prop] = callbackForObjects(value)
                        }
                        func(obj[prop]);
                    } else {
                        obj[prop] = callback(value)
                    }
                }
            }
        }
        func(result);
        return result
    },
    haversineDistance(lon1, lat1, lon2, lat2) {
        function toRad(x) {
            return x * Math.PI / 180;
        }
        let R = 6371 * 1000;
        let x1 = lat2 - lat1;
        let dLat = toRad(x1);
        let x2 = lon2 - lon1;
        let dLon = toRad(x2)
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d;
    },
    popupWindow: (url, title, win, w = 0, h = 0) => {
        const y = win.top.outerHeight / 2 + win.top.screenY - (h / 2);
        const x = win.top.outerWidth / 2 + win.top.screenX - (w / 2);
        let params = 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no'
        if (w || h) {
            params += `,width=${w}, height=${h}, top=${y}, left=${x}`
        }
        return win.open(url, title, params);
    },
    qsAll: (query) => {
        let nodeList = document.querySelectorAll(query);
        let result = [];
        for (let i = 0; i < nodeList.length; i++) {
            result.push(<HTMLInputElement>nodeList[i])
        }
        return result

    },
    qs: (query) => { return <HTMLInputElement>document.querySelector(query) },

}
